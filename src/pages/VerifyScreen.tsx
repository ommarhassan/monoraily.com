import { useEffect, useRef, useState } from 'react';
import { brand } from '../config/brand';
import { scanAtGate, type Verdict } from '../lib/ticketing';

/** Opened when someone scans a ticket QR with a phone camera (URL contains ?verify=<token>). */
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
        <p>
          {!verdict
            ? ''
            : !verdict.ok
              ? 'البوابة فضلت مقفولة.'
              : verdict.type === 'ticket'
                ? `${verdict.name} · ${verdict.from} ← ${verdict.to}`
                : `${verdict.name} · باقي ${verdict.tripsLeft} من ${verdict.tripsTotal} رحلة`}
        </p>
        <div className="gate-actions">
          <a className="outline-button"
