import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Icon from '../components/Icon';
import { ticketKindLabels } from '../data/fares';
import { myTickets } from '../lib/db';
import { formatTime, num } from '../lib/format';
import { configured } from '../lib/supabase';
import { loadTickets, qrImage, statusText, ticketFromRow, ticketStatus, type Ticket } from '../lib/ticketing';

const POLL_MS = 2000;
const POLL_MAX_ATTEMPTS = 10;

export default function MyTicketsPage({ onPlan, justPaid }: { onPlan: () => void; justPaid?: string | null }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>(() => (configured ? [] : loadTickets()));
  const [loading, setLoading] = useState(configured);
  const [waiting, setWaiting] = useState(false);
  const [qrs, setQrs] = useState<Record<string, string>>({});

  // Load the tickets from Supabase. After a payment, keep polling for a few seconds
  // because the webhook may arrive a moment after the customer is redirected back.
  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    const load = async () => {
      const rows = await myTickets();
      const list = await Promise.all(rows.map(ticketFromRow));
      if (cancelled) return;
      setTickets(list);
      setLoading(false);

      const found = !justPaid || list.some((t) => t.id === justPaid);
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

  const paidTicket = justPaid ? tickets.find((t) => t.id === justPaid) : undefined;
  const paymentLate = Boolean(justPaid) && !paidTicket && !waiting && !loading;

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">محفظتك</span>
        <h1>تذاكرك، في جيبك.</h1>
        <p>كل تذكرة اشتريتها محفوظة هنا.</p>
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
      {waiting && (
        <div className="result-card" role="status">
          <span className="eyebrow green">لحظة</span>
          <h3>بنأكد الدفع…</h3>
          <p>التذكرة هتظهر هنا خلال ثواني.</p>
        </div>
      )}
      {paymentLate && (
        <div className="result-card" role="status">
          <h3>الدفع لسه بيتأكد.</h3>
          <p>لو اتخصم منك، حدّث الصفحة بعد دقيقة وهتلاقي التذكرة هنا.</p>
        </div>
      )}

      {loading ? (
        <p className="auth-sub">بنحمّل…</p>
      ) : tickets.length === 0 ? (
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
        <div className="wallet-grid">
          {tickets.map((ticket) => {
            const status = ticketStatus(ticket);
            return (
              <article className={`wallet-card ${status}`} key={ticket.id}>
                {qrs[ticket.id] && <img className="qr-img small" src={qrs[ticket.id]} alt={`رمز تذكرة ${ticket.id}`} />}
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
      )}
    </div>
  );
}
