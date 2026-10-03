import QRCode from 'qrcode';
import { brand } from '../config/brand';
import { fareForStops, type TicketKind } from '../data/fares';
import { decodeJson, encodeJson, sign } from './crypto';
import type { DbTicket } from './db';
import type { Route } from './routing';
import { readStorage, writeStorage } from './storage';

export type Ticket = {
  id: string;
  name: string;
  from: string;
  to: string;
  fare: number;
  stops: number;
  kind: TicketKind;
  /** Expiry timestamp (ms). */
  exp: number;
  /** Signed payload: `<base64 body>.<signature>`. This is what the QR carries. */
  token: string;
  pay: string;
};

export type Verdict =
  | { ok: true; id: string; name: string; from: string; to: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'used'; message: string };

export type TicketStatus = 'valid' | 'used' | 'expired';

export const statusText: Record<TicketStatus, string> = { valid: 'صالحة', used: 'مستخدمة', expired: 'منتهية' };

const TICKET_LIFETIME_MS = 2 * 60 * 60 * 1000;

type TokenBody = { id: string; n: string; f: string; t: string; p: number; k: TicketKind; e: number };

const randomId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => x.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

export const loadTickets = () => readStorage<Ticket[]>('tickets', []);
const usedIds = () => readStorage<string[]>('used', []);

export const ticketStatus = (ticket: Ticket): TicketStatus =>
  usedIds().includes(ticket.id) ? 'used' : ticket.exp < Date.now() ? 'expired' : 'valid';

export async function issueTicket(route: Route, name: string, pay: string, kind: TicketKind = 'full'): Promise<Ticket> {
  const id = `${brand.ticketPrefix}-${randomId()}`;
  const exp = Date.now() + TICKET_LIFETIME_MS;
  const from = route.names[0];
  const to = route.names[route.names.length - 1];
  const fare = fareForStops(route.stops, kind);

  const body = encodeJson({ id, n: name, f: from, t: to, p: fare, k: kind, e: exp } satisfies TokenBody);
  const ticket: Ticket = {
    id,
    name,
    from,
    to,
    fare,
    stops: route.stops,
    kind,
    exp,
    pay,
    token: `${body}.${await sign(body)}`,
  };
  writeStorage('tickets', [ticket, ...loadTickets()]);
  return ticket;
}

/**
 * Rebuilds a signed ticket (with its QR token) from a row saved in Supabase.
 * The DB has no "kind" column, so it is derived: a half ticket always costs the half fare for its stops.
 */
export async function ticketFromRow(row: DbTicket): Promise<Ticket> {
  const exp = new Date(row.exp).getTime();
  const kind: TicketKind = fareForStops(row.stops, 'half') === row.fare ? 'half' : 'full';
  const body = encodeJson({
    id: row.id,
    n: row.rider_name,
    f: row.from_station,
    t: row.to_station,
    p: row.fare,
    k: kind,
    e: exp,
  } satisfies TokenBody);
  return {
    id: row.id,
    name: row.rider_name,
    from: row.from_station,
    to: row.to_station,
    fare: row.fare,
    stops: row.stops,
    kind,
    exp,
    pay: row.pay,
    token: `${body}.${await sign(body)}`,
  };
}

/** The QR holds a link, so a phone camera opens the gate result page directly. */
export const qrImage = (token: string) =>
  QRCode.toDataURL(`${location.origin}${location.pathname}?verify=${token}`, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 280,
    color: { dark: '#192a4c', light: '#ffffff' },
  });

/** The gate: checks the signature, then the expiry, then whether the code was already used. */
export async function scanAtGate(token: string): Promise<Verdict> {
  const invalid: Verdict = { ok: false, reason: 'invalid', message: 'رمز غير صحيح أو متلاعب فيه' };
  const [body, signature] = token.trim().split('.');
  if (!body || !signature || (await sign(body)) !== signature) return invalid;

  let data: TokenBody;
  try {
    data = decodeJson<TokenBody>(body);
  } catch {
    return invalid;
  }

  if (data.e < Date.now()) return { ok: false, reason: 'expired', message: 'انتهت صلاحية التذكرة' };
  const used = usedIds();
  if (used.includes(data.id)) return { ok: false, reason: 'used', message: 'التذكرة اتستخدمت قبل كده' };

  writeStorage('used', [...used, data.id]);
  return { ok: true, id: data.id, name: data.n, from: data.f, to: data.t };
}

/** Breaks the signature on purpose, to demo that the gate rejects forged codes. */
export const tamper = (token: string) => token.slice(0, -4) + (token.endsWith('AAAA') ? 'BBBB' : 'AAAA');

/** The in-app scanner unwraps the QR link back to the raw token. */
export const tokenFrom = (text: string) => {
  try {
    return new URL(text).searchParams.get('verify') ?? text;
  } catch {
    return text;
  }
};
