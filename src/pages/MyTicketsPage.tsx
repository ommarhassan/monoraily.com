import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Icon from '../components/Icon';
import { getStationName } from '../components/StationPicker';
import { ticketKindLabels } from '../data/fares';
import { useLanguage } from '../i18n/LanguageContext';
import { mySubscriptions, myTickets } from '../lib/db';
import { formatTime, num } from '../lib/format';
import { configured } from '../lib/supabase';
import {
  loadTickets,
  qrImage,
  statusText,
  subFromRow,
  subStatus,
  subStatusText,
  ticketFromRow,
  ticketStatus,
  tripsLeft,
  type SubPass,
  type Ticket,
} from '../lib/ticketing';

const POLL_MS = 2000;
const POLL_MAX_ATTEMPTS = 10;

export default function MyTicketsPage({ onPlan, justPaid }: { onPlan: () => void; justPaid?: string | null }) {
  const { t, locale, lang } = useLanguage();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>(() => (configured ? [] : loadTickets()));
  const [subs, setSubs] = useState<SubPass[]>([]);
  const [loading, setLoading] = useState(configured);
  const [waiting, setWaiting] = useState(false);
  const [qrs, setQrs] = useState<Record<string, string>>({});

  // Load the tickets and subscriptions from Supabase. After a payment, keep polling for a few seconds
  // because the webhook may arrive a moment after the customer is redirected back.
  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    const load = async () => {
      const [rows, subRows] = await Promise.all([myTickets(), mySubscriptions()]);
      const [list, subList] = await Promise.all([
        Promise.all(rows.map(ticketFromRow)),
        Promise.all(subRows.map(subFromRow)),
      ]);
      if (cancelled) return;
      setTickets(list);
      setSubs(subList);
      setLoading(false);

      const found = !justPaid || list.some((t) => t.id === justPaid) || subList.some((s) => s.id === justPaid);
      attempts += 1;
      if (found || attempts >= POLL_MAX_ATTEMPTS) {
        setWaiting(false);
        return;
      }
      setWaiting(true);
      timer = window.setTimeout(load, POLL_MS);
    };

    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [user?.id, justPaid]);

  useEffect(() => {
    tickets.forEach(async (ticket) => {
      const url = await qrImage(ticket.token);
      setQrs((current) => ({ ...current, [ticket.id]: url }));
    });
  }, [tickets]);

  useEffect(() => {
    subs.forEach(async (sub) => {
      if (!sub.token) return;
      const url = await qrImage(sub.token);
      setQrs((current) => ({ ...current, [sub.id]: url }));
    });
  }, [subs]);

  const paidTicket = justPaid ? tickets.find((t) => t.id === justPaid) : undefined;
  const paidSub = justPaid ? subs.find((s) => s.id === justPaid) : undefined;
  const paymentLate = Boolean(justPaid) && !paidTicket && !paidSub && !waiting && !loading;

  const planName = (plan: string) => t(`plan.${plan}` as any) || plan;
  const zoneName = (zone: number) => t(`zone.${zone}.short`);

  const isEmpty = tickets.length === 0 && subs.length === 0;

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">{t('tickets.eyebrow')}</span>
        <h1>{t('tickets.title')}</h1>
        <p>{t('tickets.intro')}</p>
      </div>

      {paidTicket && (
        <div className="result-card" role="status">
          <span className="eyebrow green">{t('tickets.paidEyebrow')}</span>
          <h3>{t('tickets.ticketReady')}</h3>
          <p>
            {t('tickets.ticketInfo', {
              route: `${getStationName(paidTicket.from, lang)} ← ${getStationName(paidTicket.to, lang)}`,
              id: paidTicket.id,
            })}
          </p>
        </div>
      )}
      {paidSub && (
        <div className="result-card" role="status">
          <span className="eyebrow green">{t('tickets.paidEyebrow')}</span>
          <h3>{t('tickets.subActivated')}</h3>
          <p>
            {t('tickets.subInfo', {
              plan: planName(paidSub.plan),
              zone: zoneName(paidSub.zone),
              trips: num(paidSub.tripsTotal, locale),
            })}
          </p>
        </div>
      )}
      {waiting && (
        <div className="result-card" role="status">
          <span className="eyebrow green">{t('tickets.waitEyebrow')}</span>
          <h3>{t('tickets.waitTitle')}</h3>
          <p>{t('tickets.waitText')}</p>
        </div>
      )}
      {paymentLate && (
        <div className="result-card" role="status">
          <h3>{t('tickets.lateTitle')}</h3>
          <p>{t('tickets.lateText')}</p>
        </div>
      )}

      {loading ? (
        <p className="auth-sub">{t('common.loading')}</p>
      ) : isEmpty ? (
        <div className="result-card empty-result">
          <div className="empty-illustration">
            <Icon name="ticket" size={48} />
          </div>
          <span className="eyebrow green">{t('tickets.emptyEyebrow')}</span>
          <h3>{t('tickets.emptyTitle')}</h3>
          <p>{t('tickets.emptyText')}</p>
          <button className="dark-button" onClick={onPlan}>
            {t('tickets.newTrip')} <Icon name="arrow" size={16} />
          </button>
        </div>
      ) : (
        <>
          {subs.length > 0 && (
            <>
              <h2 className="wallet-section-title">{t('tickets.subsHeading')}</h2>
              <div className="wallet-grid">
                {subs.map((sub) => {
                  const status = subStatus(sub);
                  const left = tripsLeft(sub);
                  return (
                    <article className={`wallet-card ${status}`} key={sub.id}>
                      {qrs[sub.id] && (
                        <img
                          className="qr-img small"
                          src={qrs[sub.id]}
                          alt={t('tickets.qrSubAlt', { id: sub.id })}
                        />
                      )}
                      <div>
                        <span className={`status-pill ${status}`}>{subStatusText[status]}</span>
                        <h3>
                          {t('tickets.subTitle', { plan: planName(sub.plan), zone: zoneName(sub.zone) })}
                        </h3>
                        <p>
                          {t('tickets.subLeft', {
                            name: sub.name,
                            left: num(Math.max(0, left), locale),
                            total: num(sub.tripsTotal, locale),
                          })}
                        </p>
                        <div className="trip-meter" aria-hidden="true">
                          <span style={{ width: `${Math.max(0, Math.min(100, (left / sub.tripsTotal) * 100))}%` }} />
                        </div>
                        <small>
                          {t('tickets.subExpires', { id: sub.id, when: formatTime(sub.exp, locale) })}
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
              {subs.length > 0 && <h2 className="wallet-section-title">{t('tickets.ticketsHeading')}</h2>}
              <div className="wallet-grid">
                {tickets.map((ticket) => {
                  const status = ticketStatus(ticket);
                  return (
                    <article className={`wallet-card ${status}`} key={ticket.id}>
                      {qrs[ticket.id] && (
                        <img
                          className="qr-img small"
                          src={qrs[ticket.id]}
                          alt={t('tickets.qrTicketAlt', { id: ticket.id })}
                        />
                      )}
                      <div>
                        <span className={`status-pill ${status}`}>{statusText[status]}</span>
                        <h3>
                          {getStationName(ticket.from, lang)} ← {getStationName(ticket.to, lang)}
                        </h3>
                        <p>
                          {t('tickets.ticketMeta', {
                            name: ticket.name,
                            fare: num(ticket.fare, locale),
                            kind: ticketKindLabels[ticket.kind ?? 'full'],
                          })}
                        </p>
                        <small>
                          {t('tickets.ticketExpires', { id: ticket.id, when: formatTime(ticket.exp, locale) })}
                        </small>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
