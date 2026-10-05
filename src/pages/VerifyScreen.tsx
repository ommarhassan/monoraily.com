import { useEffect, useRef, useState } from 'react';
import { brand } from '../config/brand';
import { scanAtGate, verdictDetail, type Verdict } from '../lib/ticketing';

/** Opened when staff scan a ticket or subscription QR with a phone camera (URL contains ?verify=<token>). */
export default function VerifyScreen({ token }: { token: string }) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in dev: the guard makes sure a ticket is only consumed once.
    if (started.current) return;
    started.current = true;
    void scanAtGate(token).then(setVerdict);
  }, [token]);

  const state = verdict ? (verdict.ok ? 'ok' : 'no') : 'idle';

  return (
    <div className="verify-screen" dir="rtl">
      <div className={`gate-card ${state}`} aria-live="polite">
        <div className="gate-doors">
          <i />
          <i />
        </div>
        <h2>{!verdict ? 'جاري التحقق…' : verdict.ok ? 'تم التحقق ✓ اتفضل' : `مرفوض: ${verdict.message}`}</h2>
        <p>{verdict?.ok ? verdictDetail(verdict) : verdict ? 'البوابة فضلت مقفولة.' : ''}</p>
        <div className="gate-actions">
          <a className="outline-button" href={window.location.pathname}>
            الرجوع لـ {brand.name}
          </a>
        </div>
      </div>
    </div>
  );
}
