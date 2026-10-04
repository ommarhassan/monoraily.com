import QRCode from 'qrcode';
import type { TicketKind } from '../data/fares';
import type { DbTicket } from './db';
import type { Route } from './routing';
import { readStorage } from './storage';
import { supabase } from './supabase';

export type Ticket = {
  id: string;
  name: string;
  from: string;
  to: string;
  fare: number;
  stops: number;
  kind: TicketKind;
  /** Riders covered by this ticket (1 for a single ticket). */
  passengers?: number;
  /** Entries already consumed at the gate. */
  entriesUsed?: number;
  /** Expiry timestamp (ms). */
  exp: number;
  /** Server-signed QR token: `<ticketId>.<signature>`. Empty when the ticket can no longer be used. */
  token: string;
  pay: string;
};

export type Verdict =
  | {
      ok: true;
      id: string;
      name: string;
      from: string;
      to: string;
      kind: TicketKind;
      passengers: number;
      entriesUsed: number;
    }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' | 'error'; message: string };

export type TicketStatus = 'valid' | 'used' | 'expired';

export const statusText: Record<TicketStatus, string> = { valid: 'صالحة', used: 'مستخدمة', expired: 'منتهية' };

const reasonText = {
  invalid: 'رمز غير صحيح أو متلاعب فيه',
  expired: 'انتهت صلاحية التذكرة',
  used: 'التذكرة اتستخدمت قبل كده',
} as const;

/** Only used when Supabase is not configured (local demo list). */
export const loadTickets = () => readStorage<Ticket[]>('tickets', []);

const entriesLeft = (t: { passengers?: number; entriesUsed?: number }) => (t.passengers ?? 1) - (t.entriesUsed ?? 0);

export const ticketStatus = (ticket: Ticket): TicketStatus =>
  entriesLeft(ticket) <= 0 ? 'used' : ticket.exp < Date.now() ? 'expired' : 'valid';

/**
 * Removed: tickets are now created by the server after a successful payment (create-payment + webhook).
 * Kept only so old imports still compile; delete it once nothing imports it.
 */
export async function issueTicket(
  _route: Route,
  _name: string,
  _pay: string,
  _kind: TicketKind = 'full',
): Promise<Ticket> {
  throw new Error('Tickets are issued by the server after payment.');
}

/** Asks the server for a signed QR token. The signing secret never reaches the browser. */
async function fetchToken(ticketId: string): Promise<string> {
  if (!supabase) return '';
  const { data, error } = await supabase.functions.invoke('ticket-token', { body: { ticket_id: ticketId } });
  if (error || typeof data?.token !== 'string') {
    console.error('ticket-token failed', error);
    return '';
  }
  return data.token;
}

/** Builds a ticket from a Supabase row. A QR token is fetched only for tickets that can still be used. */
export async function ticketFromRow(row: DbTicket): Promise<Ticket> {
  const ticket: Ticket = {
    id: row.id,
    name: row.rider_name,
    from: row.from_station,
    to: row.to_station,
    fare: row.fare,
    stops: row.stops,
    kind: row.kind ?? 'full',
    passengers: row.passengers ?? 1,
    entriesUsed: row.entries_used ?? 0,
    exp: new Date(row.exp).getTime(),
    pay: row.pay,
    token: '',
  };
  if (ticketStatus(ticket) === 'valid') ticket.token = await fetchToken(row.id);
  return ticket;
}

/** The QR holds a link, so a phone camera opens the gate result page directly. */
export const qrImage = (token: string) =>
  QRCode.toDataURL(`${location.origin}${location.pathname}?verify=${token}`, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 280,
    color: { dark: '#192a4c', light: '#ffffff' },
  });

/** The gate (staff only): the server checks the signature and expiry, then takes one entry atomically. */
export async function scanAtGate(token: string): Promise<Verdict> {
  const clean = token.trim();
  if (!supabase) return { ok: false, reason: 'error', message: 'السيرفر مش متصل' };

  const { data, error } = await supabase.functions.invoke('verify-ticket', { body: { token: clean, mode: 'consume' } });
  if (error) {
    const status = (error as { context?: Response }).context?.status;
    const message =
      status === 401 ? 'سجّل دخول الأول' : status === 403 ? 'المسح للموظفين فقط' : 'حصلت مشكلة في الاتصال بالبوابة';
    return { ok: false, reason: 'error', message };
  }

  if (data?.ok) {
    return {
      ok: true,
      id: clean.slice(0, clean.lastIndexOf('.')),
      name: data.rider_name,
      from: data.from,
      to: data.to,
      kind: data.kind,
      passengers: data.passengers,
      entriesUsed: data.entries_used,
    };
  }
  const reason: 'invalid' | 'expired' | 'used' =
    data?.reason === 'expired' || data?.reason === 'used' ? data.reason : 'invalid';
  return { ok: false, reason, message: reasonText[reason] };
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
