import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useAuth } from '../auth/AuthContext';
import { getStationName } from '../components/StationPicker';
import { useLanguage } from '../i18n/LanguageContext';
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
  const { t, locale, lang } = useLanguage();
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
        <span className="eyebrow green">{t('gate.eyebrow')}</span>
        <h1>{t('gate.title')}</h1>
        <p>{isStaff ? t('gate.introStaff') : t('gate.introRider')}</p>
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
                <h2>
                  {!verdict
                    ? t('gate.ready')
                    : verdict.ok
                    ? t('gate.verified')
                    : t('gate.rejected', { reason: verdict.message })}
                </h2>
                <p>
                  {!verdict
                    ? t('gate.readyHint')
                    : verdict.ok
                    ? verdictDetail(verdict)
                    : t('gate.stayedClosed')}
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
                {scanning ? t('gate.stopCamera') : t('gate.scanCamera')}
              </button>
              <button
                className="outline-button"
                disabled={!firstUsable}
                onClick={() => firstUsable && check(tamper(firstUsable))}
              >
                {t('gate.tryForged')}
              </button>
            </div>
            {cameraError && <p className="gate-error">{t('gate.cameraError')}</p>}
          </div>
        )}

        <aside className="network-aside">
          {loading ? (
            <p>{t('common.loading')}</p>
          ) : nothingYet ? (
            <>
              <h3>{t('tickets.ticketsHeading')}</h3>
              <p>{t('gate.noneYet')}</p>
            </>
          ) : (
            <>
              {subs.length > 0 && (
                <>
                  <h3>{t('tickets.subsHeading')}</h3>
                  <ul className="gate-list">
                    {subs.map((sub) => (
                      <li key={sub.id}>
                        <div>
                          <strong>
                            {t('tickets.subTitle', { plan: planLabel(sub.plan), zone: zoneLabel(sub.zone) })}
                          </strong>
                          <small>
                            {t('gate.subMeta', {
                              id: sub.id,
                              status: subStatusText[subStatus(sub)],
                              left: num(tripsLeft(sub), locale),
                              total: num(sub.tripsTotal, locale),
                            })}
                          </small>
                        </div>
                        {isStaff && sub.token && (
                          <button className="outline-button" onClick={() => check(sub.token)}>
                            {t('gate.scan')}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {tickets.length > 0 && (
                <>
                  <h3>{t('tickets.ticketsHeading')}</h3>
                  <ul className="gate-list">
                    {tickets.map((ticket) => (
                      <li key={ticket.id}>
                        <div>
                          <strong>
                            {getStationName(ticket.from, lang)} ← {getStationName(ticket.to, lang)}
                          </strong>
                          <small>
                            {ticket.id} · {statusText[ticketStatus(ticket)]}
                            {(ticket.passengers ?? 1) > 1 &&
                              t('gate.passengers', {
                                n: num(ticket.passengers ?? 1, locale),
                                used: num(ticket.entriesUsed ?? 0, locale),
                              })}
                          </small>
                        </div>
                        {isStaff && ticket.token && (
                          <button className="outline-button" onClick={() => check(ticket.token)}>
                            {t('gate.scan')}
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
