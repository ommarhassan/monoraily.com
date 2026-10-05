import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useAuth } from '../auth/AuthContext';
import { mySubscriptions, myTickets } from '../lib/db';
import { num } from '../lib/format';
import { configured, supabase } from '../lib/supabase';
import {
  loadTickets,
  planLabel,
  scanAtGate,
  statusText,
  subFromRow,
  subStatus,
  subStatusText,
  tamper,
  ticketFromRow,
  ticketStatus,
  tokenFrom,
  tripsLeft,
  verdictDetail,
  zoneLabel,
  type SubPass,
  type Ticket,
  type Verdict,
} from '../lib/ticketing';

const VERDICT_VISIBLE_MS = 4500;

type Wallet = { tickets: Ticket[]; subs: SubPass[] };

/** Tickets and subscriptions live in Supabase (paid ones included); falls back to this device when Supabase is not configured. */
async function loadAll(): Promise<Wallet> {
  if (!configured) return { tickets: loadTickets(), subs: [] };
  const [rows, subRows] = await Promise.all([myTickets(), mySubscriptions()]);
  const [tickets, subs] = await Promise.all([
    Promise.all(rows.map(ticketFromRow)),
    Promise.all(subRows.map(subFromRow)),
  ]);
  return { tickets, subs };
}

export default function GatePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>(() => (configured ? [] : loadTickets()));
  const [subs, setSubs] = useState<SubPass[]>([]);
  const [loading, setLoading] = useState(configured);
  const [isStaff, setIsStaff] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  const refresh = async () => {
    const wallet = await loadAll();
    setTickets(wallet.tickets);
    setSubs(wallet.subs);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    void loadAll().then((wallet) => {
      if (cancelled) return;
      setTickets(wallet.tickets);
      setSubs(wallet.subs);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Only staff (admin) can use the gate. The server enforces this too; this just decides what to show.
  useEffect(() => {
    if (!supabase || !user?.id) {
      setIsStaff(false);
      return;
    }
    let cancelled = false;
    void supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsStaff(data?.role === 'admin');
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const check = async (token: string) => {
    setVerdict(await scanAtGate(token));
    void refresh(); // the entry / trip count changed on the server
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
  const firstUsable = tickets.find((t) => t.token)?.token ?? subs.find((s) => s.token)?.token;
  const nothingYet = tickets.length === 0 && subs.length === 0;

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">محاكاة بوابة المحطة</span>
        <h1>امسح، وادخل.</h1>
        <p>
          {isStaff
            ? 'البوابة بتتحقق من التوقيع والصلاحية على السيرفر، وبتخصم دخلة (أو رحلة من الاشتراك) مع كل مسح.'
            : 'المسح عند البوابة للموظفين بس. هنا بتشوف حالة تذاكرك واشتراكاتك.'}
        </p>
      </div>

      <div className="network-layout">
        {isStaff && (
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
                    ? 'شغّل الكاميرا أو اختار تذكرة من القائمة.'
                    : verdict.ok
                      ? verdictDetail(verdict)
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
              <button
                className="outline-button"
                disabled={!firstUsable}
                onClick={() => firstUsable && check(tamper(firstUsable))}
              >
                جرّب رمز مزوّر
              </button>
            </div>
            {cameraError && <p className="gate-error">مقدرناش نفتح الكاميرا. اسمح بالوصول أو امسح من القائمة.</p>}
          </div>
        )}

        <aside className="network-aside">
          {loading ? (
            <p>بنحمّل…</p>
          ) : nothingYet ? (
            <>
              <h3>تذاكرك</h3>
              <p>احجز تذكرة الأول من الرئيسية.</p>
            </>
          ) : (
            <>
              {subs.length > 0 && (
                <>
                  <h3>اشتراكاتك</h3>
                  <ul className="gate-list">
                    {subs.map((sub) => (
                      <li key={sub.id}>
                        <div>
                          <strong>
                            اشتراك {planLabel(sub.plan)} · {zoneLabel(sub.zone)}
                          </strong>
                          <small>
                            {sub.id} · {subStatusText[subStatus(sub)]} · باقي {num(tripsLeft(sub))} من{' '}
                            {num(sub.tripsTotal)} رحلة
                          </small>
                        </div>
                        {isStaff && sub.token && (
                          <button className="outline-button" onClick={() => check(sub.token)}>
                            امسح
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {tickets.length > 0 && (
                <>
                  <h3>تذاكرك</h3>
                  <ul className="gate-list">
                    {tickets.map((ticket) => (
                      <li key={ticket.id}>
                        <div>
                          <strong>
                            {ticket.from} ← {ticket.to}
                          </strong>
                          <small>
                            {ticket.id} · {statusText[ticketStatus(ticket)]}
                            {(ticket.passengers ?? 1) > 1 &&
                              ` · ${ticket.passengers} ركاب (${ticket.entriesUsed ?? 0}/${ticket.passengers})`}
                          </small>
                        </div>
                        {isStaff && ticket.token && (
                          <button className="outline-button" onClick={() => check(ticket.token)}>
                            امسح
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
