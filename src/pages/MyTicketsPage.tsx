import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { ticketKindLabels } from '../data/fares';
import { formatTime, num } from '../lib/format';
import { loadTickets, qrImage, statusText, ticketStatus } from '../lib/ticketing';

export default function MyTicketsPage({ onPlan }: { onPlan: () => void }) {
  const [tickets] = useState(loadTickets);
  const [qrs, setQrs] = useState<Record<string, string>>({});

  useEffect(() => {
    tickets.forEach(async (ticket) => {
      const url = await qrImage(ticket.token);
      setQrs((current) => ({ ...current, [ticket.id]: url }));
    });
  }, [tickets]);

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">محفظتك</span>
        <h1>تذاكرك، في جيبك.</h1>
        <p>كل تذكرة اشتريتها محفوظة هنا وبتشتغل من غير إنترنت.</p>
      </div>

      {tickets.length === 0 ? (
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
