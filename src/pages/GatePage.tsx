import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useAuth } from '../auth/AuthContext';
import { myTickets } from '../lib/db';
import { configured } from '../lib/supabase';
import {
  loadTickets,
  scanAtGate,
  statusText,
  tamper,
  ticketFromRow,
  ticketStatus,
  tokenFrom,
  type Ticket,
  type Verdict,
} from '../lib/ticketing';

const VERDICT_VISIBLE_MS = 4500;

/** Tickets live in Supabase (paid ones included); falls back to this device when Supabase is not configured. */
async function loadAll(): Promise<Ticket[]> {
  if (!configured) return loadTickets();
  const rows = await myTickets();
  return Promise.all(rows.map(ticketFromRow));
}

export default function GatePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>(() => (configured ? [] : loadTickets()));
  const [loading, setLoading] = useState(configured);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    void loadAll().then((list) => {
      if (cancelled) return;
      setTickets(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const check = async (token: string) => {
    setVerdict(await scanAtGate(token));
    // "used" status is kept on this device, so a re-render is enough to refresh the list.
    setTickets((current) => [...current]);
    window.setTimeout(() => setVerdict(null), VERDICT_VISIBLE_MS);
  };

  // Camera scanning loop: read frames, look for a QR code, stop at the first hit.
  useEffect(() => {
    if (!scanning) return;
    let stopped = false;
    let stream: MediaStream | undefined;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((mediaStream) => {
        stream = mediaStream;
        const el = video.current!;
        el.srcObject = mediaStream;
        void el.play();

        const tick = () => {
          if (stopped) return;
          if (el.readyState === el.HAVE_ENOUGH_DATA) {
            canvas.width = el.videoWidth;
            canvas.height = el.videoHeight;
            ctx.drawImage(el, 0, 0);
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(frame.data, frame.width, frame.height);
            if (code) {
              stopped = true;
              setScanning(false);
              void check(tokenFrom(code.data));
              return;
            }
          }
          requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => {
        setScanning(false);
        setCameraError(true);
      });

    return () => {
      stopped = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [scanning]);

  const state = verdict ? (verdict.ok ? 'ok' : 'no') : 'idle';

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">محاكاة بوابة المحطة</span>
        <h1>امسح، وادخل.</h1>
        <p>البوابة بتتحقق من التوقيع والصلاحية، وبترفض أي رمز اتستخدم قبل كده.</p>
      </div>

      <div className="network-layout">
        <div className={`gate-card ${state}`} aria-live="polite">
          <div className="gate-doors">
            <i />
            <i />
          </div>

          {scanning ? (
            <video ref={video} className="scan-video" muted playsInline />
          ) : (
            <>
              <h2>{!verdict ? 'جاهزة للمسح' : verdict.ok ? 'اتفضل، تم التحقق ✓' : `مرفوض: ${verdict.message}`}</h2>
              <p>
                {!verdict
                  ? 'اختار تذكرة من القائمة أو شغّل الكاميرا.'
                  : verdict.ok
                    ? `${verdict.name} · ${verdict.from} ← ${verdict.to}`
                    : 'البوابة فضلت مقفولة.'}
              </p>
            </>
          )}

          <div className="gate-actions">
            <button
              className="dark-button"
              onClick={() => {
                setCameraError(false);
                setScanning((s) => !s);
              }}
            >
              {scanning ? 'إيقاف الكاميرا' : 'امسح بالكاميرا'}
            </button>
            <button className="outline-button" disabled={!tickets[0]} onClick={() => check(tamper(tickets[0].token))}>
              جرّب رمز مزوّر
            </button>
          </div>
          {cameraError && <p className="gate-error">مقدرناش نفتح الكاميرا. اسمح بالوصول أو امسح من القائمة.</p>}
        </div>

        <aside className="network-aside">
          <h3>تذاكرك</h3>
          {loading ? (
            <p>بنحمّل…</p>
          ) : tickets.length === 0 ? (
            <p>احجز تذكرة الأول من الرئيسية.</p>
          ) : (
            <ul className="gate-list">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <div>
                    <strong>
                      {ticket.from} ← {ticket.to}
                    </strong>
                    <small>
                      {ticket.id} · {statusText[ticketStatus(ticket)]}
                    </small>
                  </div>
                  <button className="outline-button" onClick={() => check(ticket.token)}>
                    امسح
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
