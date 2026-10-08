import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { getStationName } from '../components/StationPicker';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { mySubscriptions, myTickets } from '../lib/db';
import { formatDate, formatTime, num } from '../lib/format';
import { configured } from '../lib/supabase';
import { qrImage, subFromRow, ticketFromRow, ticketStatus, tripsLeft } from '../lib/ticketing';

type Status = 'valid' | 'used' | 'expired';

type SavedSubscription = {
  id: string;
  userId: string;
  plan: string;
  zone: number;
  holderName: string;
  tripsLeft: number;
  tripsTotal: number;
  expiresAt: string;
  payload: string;
};

type SavedTicket = {
  id: string;
  userId: string;
  route: string;
  fare: number;
  kind: 'full' | 'half';
  status: Status | string;
  expiresAt: string;
  payload: string;
};

type Props = { onPlan: () => void; justPaid?: string | null };

const POLL_MS = 2000;
const POLL_MAX_ATTEMPTS = 10;

const planNames: Record<string, { ar: string; en: string }> = {
  weekly: { ar: 'أسبوعي', en: 'Weekly' },
  monthly: { ar: 'شهري', en: 'Monthly' },
  quarterly: { ar: 'ربع سنوي', en: 'Quarterly' },
};

const planTrips: Record<string, number> = {
  weekly: 14,
  monthly: 60,
  quarterly: 180,
};

const zoneNames: Record<number, { ar: string; en: string }> = {
  0: { ar: 'منطقة واحدة', en: 'One zone' },
  1: { ar: 'منطقتان', en: 'Two zones' },
  2: { ar: 'ثلاث مناطق', en: 'Three zones' },
  3: { ar: 'أربع مناطق', en: 'Four zones' },
};

const subState = (s: SavedSubscription): Status =>
  s.tripsLeft <= 0 ? 'used' : new Date(s.expiresAt).getTime() < Date.now() ? 'expired' : 'valid';

const ticketState = (tk: SavedTicket): Status =>
  tk.status === 'used' ? 'used' : tk.status === 'valid' ? 'valid' : 'expired';

/** Usable ones first, finished ones after. */
const usableFirst = <T,>(items: T[], state: (item: T) => Status) =>
  [...items].sort((a, b) => Number(state(b) === 'valid') - Number(state(a) === 'valid'));

export default function MyTicketsPage({ onPlan, justPaid }: Props) {
  const { user } = useAuth();
  const { lang, locale, t } = useLanguage();
  const [subs, setSubs] = useState<SavedSubscription[]>([]);
  const [tickets, setTickets] = useState<SavedTicket[]>([]);
  const [loading, setLoading] = useState(configured);
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const isAr = lang === 'ar';

  // Load from Supabase (paid tickets live there). After a payment keep checking for ~20 seconds,
  // because the webhook can arrive a moment after the customer is redirected back.
  useEffect(() => {
    if (!user) return;

    // Supabase not configured: keep the old local demo behaviour.
    if (!configured) {
      try {
        const rawSubs = localStorage.getItem(`monogo_subs_${user.id}`);
        const rawTickets = localStorage.getItem(`monogo_tickets_${user.id}`);
        if (rawSubs) setSubs(JSON.parse(rawSubs));
        if (rawTickets) setTickets(JSON.parse(rawTickets));
      } catch {
        // ignore
      }
      setLoading(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    const load = async () => {
      const [rows, subRows] = await Promise.all([myTickets(), mySubscriptions()]);
      const [ticketList, subList] = await Promise.all([
        Promise.all(rows.map(ticketFromRow)),
        Promise.all(subRows.map(subFromRow)),
      ]);
      if (cancelled) return;

      setTickets(
        ticketList.map((tk) => ({
          id: tk.id,
          userId: user.id,
          route: `${tk.from} ← ${tk.to}`,
          fare: tk.fare,
          kind: tk.kind,
          status: ticketStatus(tk),
          expiresAt: new Date(tk.exp).toISOString(),
          payload: tk.token,
        })),
      );
      setSubs(
        subList.map((s) => ({
          id: s.id,
          userId: user.id,
          plan: s.plan,
          zone: s.zone,
          holderName: s.name,
          tripsLeft: tripsLeft(s),
          tripsTotal: s.tripsTotal,
          expiresAt: new Date(s.exp).toISOString(),
          payload: s.token,
        })),
      );
      setLoading(false);

      const found =
        !justPaid || ticketList.some((x) => x.id === justPaid) || subList.some((x) => x.id === justPaid);
      attempts += 1;
      if (found || attempts >= POLL_MAX_ATTEMPTS) return;
      timer = window.setTimeout(load, POLL_MS);
    };

    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [user?.id, justPaid]);

  // QR codes are drawn in the browser: the signed token never goes to an outside service.
  useEffect(() => {
    let cancelled = false;
    [...subs, ...tickets].forEach(async (item) => {
      if (!item.payload) return;
      const url = await qrImage(item.payload);
      if (!cancelled) setQrs((current) => ({ ...current, [item.id]: url }));
    });
    return () => {
      cancelled = true;
    };
  }, [subs, tickets]);

  const justPaidSub = justPaid?.startsWith('SUB-') ? subs.find((s) => s.id === justPaid) : null;
  const justPaidTicket =
    justPaid && !justPaid.startsWith('SUB-') ? tickets.find((tk) => tk.id === justPaid) : null;

  const translateRoute = (routeText: string) => {
    if (!routeText.includes('←')) return getStationName(routeText, lang);
    const [from, to] = routeText.split('←').map((s) => s.trim());
    return `${getStationName(from, lang)} ← ${getStationName(to, lang)}`;
  };

  const ticketTag = (status: Status) =>
    status === 'valid'
      ? isAr ? 'صالحة' : 'Valid'
      : status === 'used'
        ? isAr ? 'مستخدمة' : 'Used'
        : isAr ? 'منتهية' : 'Expired';

  const subTag = (status: Status) =>
    status === 'valid'
      ? isAr ? 'نشط' : 'Active'
      : status === 'used'
        ? isAr ? 'الرحلات خلصت' : 'No trips left'
        : isAr ? 'منتهي' : 'Expired';

  const expiresText = (iso: string, verbAr: string) =>
    isAr
      ? `${verbAr} ${formatDate(iso, locale)} الساعة ${formatTime(iso, locale)}`
      : `expires ${formatDate(iso, locale)} at ${formatTime(iso, locale)}`;

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">{t('tickets.eyebrow')}</span>
        <h1>{t('tickets.title')}</h1>
        <p>{t('tickets.intro')}</p>
      </div>

      {justPaid && !loading && (
        <div className="result-card" role="status">
          <span className="eyebrow green">{t('tickets.paidEyebrow')}</span>
          {justPaidTicket && (
            <>
              <h3>{t('tickets.ticketReady')}</h3>
              <p>{t('tickets.ticketInfo', { route: translateRoute(justPaidTicket.route), id: justPaidTicket.id })}</p>
            </>
          )}
          {justPaidSub && (
            <>
              <h3>{t('tickets.subActivated')}</h3>
              <p>
                {t('tickets.subInfo', {
                  plan: planNames[justPaidSub.plan]?.[lang] || justPaidSub.plan,
                  zone: zoneNames[justPaidSub.zone]?.[lang] || justPaidSub.zone,
                  trips: num(planTrips[justPaidSub.plan] ?? justPaidSub.tripsTotal, locale),
                })}
              </p>
            </>
          )}
          {!justPaidTicket && !justPaidSub && (
            <>
              <h3>{t('tickets.waitTitle')}</h3>
              <p>{t('tickets.lateText')}</p>
            </>
          )}
        </div>
      )}

      {loading && <p className="auth-sub">{isAr ? 'بنحمّل…' : 'Loading…'}</p>}

      {subs.length > 0 && (
        <>
          <h2 className="wallet-section-title">{t('tickets.subsHeading')}</h2>
          <div className="wallet-grid">
            {usableFirst(subs, subState).map((s) => {
              const status = subState(s);
              const pName = planNames[s.plan]?.[lang] || s.plan;
              const zName = zoneNames[s.zone]?.[lang] || s.zone;
              const title = isAr ? `اشتراك ${pName} · ${zName}` : `${pName} subscription · ${zName}`;
              const pct = s.tripsTotal > 0 ? Math.max(0, Math.min(100, (s.tripsLeft / s.tripsTotal) * 100)) : 0;
              return (
                <article className={`wallet-card ${status}`} key={s.id}>
                  {qrs[s.id] && <img className="qr-img small" src={qrs[s.id]} alt={s.id} />}
                  <div>
                    <span className={`status-pill ${status}`}>{subTag(status)}</span>
                    <h3>{title}</h3>
                    <p>
                      {s.holderName} ·{' '}
                      {isAr
                        ? `باقي ${num(s.tripsLeft, locale)} من ${num(s.tripsTotal, locale)} رحلة`
                        : `${num(s.tripsLeft, locale)} of ${num(s.tripsTotal, locale)} trips left`}
                    </p>
                    <div className="trip-meter" aria-hidden="true">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <small>
                      {s.id} · {expiresText(s.expiresAt, 'ينتهي')}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {tickets.length > 0 && (
        <>
          <h2 className="wallet-section-title">{t('tickets.ticketsHeading')}</h2>
          <div className="wallet-grid">
            {usableFirst(tickets, ticketState).map((tk) => {
              const status = ticketState(tk);
              const kindLabel =
                tk.kind === 'half' ? (isAr ? 'نصف تذكرة' : 'Half ticket') : (isAr ? 'تذكرة كاملة' : 'Full ticket');
              return (
                <article className={`wallet-card ${status}`} key={tk.id}>
                  {qrs[tk.id] && <img className="qr-img small" src={qrs[tk.id]} alt={tk.id} />}
                  <div>
                    <span className={`status-pill ${status}`}>{ticketTag(status)}</span>
                    <h3>{translateRoute(tk.route)}</h3>
                    <p>
                      {kindLabel} · {num(tk.fare, locale)} {t('common.egp')}
                    </p>
                    <small>
                      {tk.id} · {expiresText(tk.expiresAt, 'تنتهي')}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {!loading && subs.length === 0 && tickets.length === 0 && !justPaid && (
        <div className="result-card empty-result">
          <div className="empty-illustration">
            <Icon name="ticket" size={48} />
          </div>
          <span className="eyebrow green">{t('tickets.emptyEyebrow')}</span>
          <h3>{t('tickets.emptyTitle')}</h3>
          <p>{t('tickets.emptyText')}</p>
          <button className="dark-button" onClick={onPlan}>
            {t('tickets.newTrip')}
          </button>
        </div>
      )}
    </div>
  );
}
