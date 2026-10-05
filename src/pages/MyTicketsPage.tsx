import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Icon from '../components/Icon';
import { fareZones, subscriptions, ticketKindLabels } from '../data/fares';
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

  const planName = (plan: string) => subscriptions.find((s) => s.id === plan)?.name ?? plan;
  const zoneName = (zone: number) => (fareZones[zone]?.label ?? '').split(' (')[0];

  const isEmpty = tickets.length === 0 && subs.length === 0;

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">محفظتك</span>
        <h1>تذاكرك، في جيبك.</h1>
        <p>كل تذكرة واشتراك اشتريتهم محفوظين هنا.</p>
      </div>

      {paidTicket && (
        <div className="result-card" role="status">
          <span className="eyebrow green">تم الدفع</span>
          <h3>تذكرتك جاهزة 🎉</h3>
          <p>
            {paidTicket.from} ← {paidTicket.to} · رقم التذكرة {paidTicket.id}
          </p>
        </div>
      )}
      {paidSub && (
        <div className="result-card" role="status">
          <span className="eyebrow green">تم الدفع</span>
          <h3>اشتراكك اتفعّل 🎉</h3>
          <p>
            {planName(paidSub.plan)} · {zoneName(paidSub.zone)} · {num(paidSub.tripsTotal)} رحلة
          </p>
        </div>
      )}
      {waiting && (
        <div className="result-card" role="status">
          <span className="eyebrow green">لحظة</span>
          <h3>بنأكد الدفع…</h3>
          <p>التذكرة أو الاشتراك هيظهر هنا خلال ثواني.</p>
        </div>
      )}
      {paymentLate && (
        <div className="result-card" role="status">
          <h3>الدفع لسه بيتأكد.</h3>
          <p>لو اتخصم منك، حدّث الصفحة بعد دقيقة وهتلاقيها هنا.</p>
        </div>
      )}

      {loading ? (
        <p className="auth-sub">بنحمّل…</p>
      ) : isEmpty ? (
        <div className="result-card empty-result">
          <div className="empty-illustration">
            <Icon name="ticket" size={48} />
          </div>
          <span className="eyebrow green">لسه مفيش</span>
          <h3>مفيش تذاكر محفوظة.</h3>
          <p>خطط رحلتك واحجز أول تذكرة.</p>
          <button className="dark-button" onClick={onPlan}>
            ابدأ رحلة جديدة <Icon name="arrow" size={16} />
          </button>
        </div>
      ) : (
        <>
          {subs.length > 0 && (
            <>
              <h2 className="wallet-section-title">اشتراكاتك</h2>
              <div className="wallet-grid">
                {subs.map((sub) => {
                  const status = subStatus(sub);
                  const left = tripsLeft(sub);
                  return (
                    <article className={`wallet-card ${status}`} key={sub.id}>
                      {qrs[sub.id] && <img className="qr-img small" src={qrs[sub.id]} alt={`رمز اشتراك ${sub.id}`} />}
                      <div>
                        <span className={`status-pill ${status}`}>{subStatusText[status]}</span>
                        <h3>
                          اشتراك {planName(sub.plan)} · {zoneName(sub.zone)}
                        </h3>
                        <p>
                          {sub.name} · باقي {num(left)} من {num(sub.tripsTotal)} رحلة
                        </p>
                        <div className="trip-meter" aria-hidden="true">
                          <span style={{ width: `${Math.max(0, Math.min(100, (left / sub.tripsTotal) * 100))}%` }} />
                        </div>
                        <small>
                          {sub.id} · ينتهي {formatTime(sub.exp)}
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
              {subs.length > 0 && <h2 className="wallet-section-title">تذاكرك</h2>}
              <div className="wallet-grid">
                {tickets.map((ticket) => {
                  const status = ticketStatus(ticket);
                  return (
                    <article className={`wallet-card ${status}`} key={ticket.id}>
                      {qrs[ticket.id] && (
                        <img className="qr-img small" src={qrs[ticket.id]} alt={`رمز تذكرة ${ticket.id}`} />
                      )}
                      <div>
                        <span className={`status-pill ${status}`}>{statusText[status]}</span>
                        <h3>
                          {ticket.from} ← {ticket.to}
                        </h3>
                        <p>
                          {ticket.name} · {num(ticket.fare)} جنيه · {ticketKindLabels[ticket.kind ?? 'full']}
                        </p>
                        <small>
                          {ticket.id} · تنتهي {formatTime(ticket.exp)}
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
