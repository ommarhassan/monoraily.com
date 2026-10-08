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
  type SubPass,
  type Ticket,
  type TicketStatus,
  type Verdict,
} from '../lib/ticketing';

const VERDICT_VISIBLE_MS = 4500;

const planNames: Record<string, { ar: string; en: string }> = {
  weekly: { ar: 'أسبوعي', en: 'Weekly' },
  monthly: { ar: 'شهري', en: 'Monthly' },
  quarterly: { ar: 'ربع سنوي', en: 'Quarterly' },
};

const zoneNames: Record<number, { ar: string; en: string }> = {
  0: { ar: 'منطقة واحدة', en: 'One zone' },
  1: { ar: 'منطقتان', en: 'Two zones' },
  2: { ar: 'ثلاث مناطق', en: 'Three zones' },
  3: { ar: 'أربع مناطق', en: 'Four zones' },
};

const statusEn: Record<TicketStatus, string> = { valid: 'Valid', used: 'Used', expired: 'Expired' };
const subStatusEn: Record<TicketStatus, string> = { valid: 'Active', used: 'No trips left', expired: 'Expired' };

const rejectionEn = {
  invalid: 'Invalid or tampered code',
  expired: 'Expired',
  used: 'Already used or no trips left',
} as const;

/** Arabic messages that scanAtGate can return for connection problems, in English. */
const errorEn: Record<string, string> = {
  'سجّل دخول الأول': 'Sign in first',
  'المسح للموظفين فقط': 'Staff only',
  'السيرفر مش متصل': 'The server is not connected',
  'حصلت مشكلة في الاتصال بالبوابة': 'Could not reach the gate',
};

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
  const { lang, locale, t } = useLanguage();
  const isAr = lang === 'ar';
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

  // ---------- Display helpers ----------

  const planName = (plan: string) => planNames[plan]?.[lang] ?? plan;
  const zoneName = (zone: number) => zoneNames[zone]?.[lang] ?? String(zone);
  const stationName = (name: string) => getStationName(name, lang);

  /** One line describing an accepted scan. */
  const acceptedDetail = (v: Extract<Verdict, { ok: true }>) => {
    if (v.type === 'subscription') {
      return isAr
        ? `${v.name} · اشتراك ${planName(v.plan)} · ${zoneName(v.zone)} · باقي ${num(v.tripsLeft, locale)} من ${num(v.tripsTotal, locale)} رحلة`
        : `${v.name} · ${planName(v.plan)} subscription · ${zoneName(v.zone)} · ${num(v.tripsLeft, locale)} of ${num(v.tripsTotal, locale)} trips left`;
    }
    const route = `${stationName(v.from)} ← ${stationName(v.to)}`;
    return isAr
      ? `${v.name} · ${route} · دخلة ${num(v.entriesUsed, locale)} من ${num(v.passengers, locale)}`
      : `${v.name} · ${route} · entry ${num(v.entriesUsed, locale)} of ${num(v.passengers, locale)}`;
  };

  const rejectionText = (v: Extract<Verdict, { ok: false }>) => {
    if (isAr) return v.message;
    if (v.reason === 'error') return errorEn[v.message] ?? 'Gate error';
    return rejectionEn[v.reason];
  };

  const state = verdict ? (verdict.ok ? 'ok' : 'no') : 'idle';
  const firstUsable = tickets.find((tk) => tk.token)?.token ?? subs.find((s) => s.token)?.token;
  const nothingYet = tickets.length === 0 && subs.length === 0;

  const headline = !verdict
    ? isAr
      ? 'جاهزة للمسح'
      : 'Ready to scan'
    : verdict.ok
      ? isAr
        ? 'اتفضل، تم التحقق ✓'
        : 'Welcome, verified ✓'
      : isAr
        ? `مرفوض: ${rejectionText(verdict)}`
        : `Rejected: ${rejectionText(verdict)}`;

  const subline = !verdict
    ? isAr
      ? 'شغّل الكاميرا أو اختار تذكرة من القائمة.'
      : 'Start the camera or pick a ticket from the list.'
    : verdict.ok
      ? acceptedDetail(verdict)
      : isAr
        ? 'البوابة فضلت مقفولة.'
        : 'The gate stayed closed.';

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
                <h2>{headline}</h2>
                <p>{subline}</p>
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
                {scanning
                  ? isAr
                    ? 'إيقاف الكاميرا'
                    : 'Stop camera'
                  : isAr
                    ? 'امسح بالكاميرا'
                    : 'Scan with camera'}
              </button>
              <button
                className="outline-button"
                disabled={!firstUsable}
                onClick={() => firstUsable && check(tamper(firstUsable))}
              >
                {isAr ? 'جرّب رمز مزوّر' : 'Try a forged code'}
              </button>
            </div>
            {cameraError && (
              <p className="gate-error">
                {isAr
                  ? 'مقدرناش نفتح الكاميرا. اسمح بالوصول أو امسح من القائمة.'
                  : "We couldn't open the camera. Allow access or scan from the list."}
              </p>
            )}
          </div>
        )}

        <aside className="network-aside">
          {loading ? (
            <p>{t('common.loading')}</p>
          ) : nothingYet ? (
            <p>{t('gate.noneYet')}</p>
          ) : (
            <>
              {subs.length > 0 && (
                <>
                  <h3>{t('tickets.subsHeading')}</h3>
                  <ul className="gate-list">
                    {subs.map((sub) => {
                      const status = subStatus(sub);
                      return (
                        <li key={sub.id}>
                          <div>
                            <strong>
                              {isAr
                                ? `اشتراك ${planName(sub.plan)} · ${zoneName(sub.zone)}`
                                : `${planName(sub.plan)} subscription · ${zoneName(sub.zone)}`}
                            </strong>
                            <small>
                              {sub.id} · {isAr ? subStatusText[status] : subStatusEn[status]} ·{' '}
                              {isAr
                                ? `باقي ${num(tripsLeft(sub), locale)} من ${num(sub.tripsTotal, locale)} رحلة`
                                : `${num(tripsLeft(sub), locale)} of ${num(sub.tripsTotal, locale)} trips left`}
                            </small>
                          </div>
                          {isStaff && sub.token && (
                            <button className="outline-button" onClick={() => check(sub.token)}>
                              {t('gate.scan')}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {tickets.length > 0 && (
                <>
                  <h3>{t('tickets.ticketsHeading')}</h3>
                  <ul className="gate-list">
                    {tickets.map((ticket) => {
                      const status = ticketStatus(ticket);
                      const riders = ticket.passengers ?? 1;
                      return (
                        <li key={ticket.id}>
                          <div>
                            <strong>
                              {stationName(ticket.from)} ← {stationName(ticket.to)}
                            </strong>
                            <small>
                              {ticket.id} · {isAr ? statusText[status] : statusEn[status]}
                              {riders > 1 &&
                                ` · ${num(riders, locale)} ${isAr ? 'ركاب' : 'riders'} (${num(ticket.entriesUsed ?? 0, locale)}/${num(riders, locale)})`}
                            </small>
                          </div>
                          {isStaff && ticket.token && (
                            <button className="outline-button" onClick={() => check(ticket.token)}>
                              {t('gate.scan')}
                            </button>
                          )}
                        </li>
                      );
                    })}
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
