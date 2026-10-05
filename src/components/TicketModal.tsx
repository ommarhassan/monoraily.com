import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../config/brand';
import { fareForStops, halfTicketEligibility, ticketKindLabels, type TicketKind } from '../data/fares';
import { num } from '../lib/format';
import type { Route } from '../lib/routing';
import { supabase } from '../lib/supabase';
import { categoryLabels, myVerification, type MyVerification } from '../lib/verification';
import Icon from './Icon';

const MAX_PASSENGERS = 7;

type Props = { route: Route; onClose: () => void; onVerify: () => void };

/** Reads the `error` code our Edge Function sends back (e.g. half_requires_verification). */
async function errorCode(error: unknown): Promise<string | null> {
  const res = (error as { context?: Response } | null)?.context;
  if (!res || typeof res.json !== 'function') return null;
  const body = await res.json().catch(() => null);
  return typeof body?.error === 'string' ? body.error : null;
}

const errorMessages: Record<string, string> = {
  half_requires_verification: 'نصف التذكرة محتاج توثيق ساري لحسابك.',
  half_single_passenger: 'نصف التذكرة لراكب واحد بس.',
};

export default function TicketModal({ route, onClose, onVerify }: Props) {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [kind, setKind] = useState<TicketKind>('full');
  const [passengers, setPassengers] = useState(1);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [verification, setVerification] = useState<MyVerification | null>(null);

  const unitPrice = fareForStops(route.stops, kind);
  const price = unitPrice * passengers;
  const from = route.names[0];
  const to = route.names[route.names.length - 1];
  const halfAllowed = Boolean(verification?.category);
  const blockedHalf = kind === 'half' && !halfAllowed;

  useEffect(() => {
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    void myVerification().then(setVerification);
  }, [user?.id]);

  const chooseKind = (next: TicketKind) => {
    setKind(next);
    if (next === 'half') setPassengers(1); // half fare is for the verified rider only
  };

  const submit = async () => {
    setBusy(true);
    setErrorText(null);
    try {
      if (!supabase || !user) throw new Error('not signed in');
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { name: name.trim(), from, to, kind, passengers },
      });
      if (error || !data?.checkout_url) {
        const code = await errorCode(error);
        setErrorText((code && errorMessages[code]) || 'حصلت مشكلة وإحنا بنبدأ الدفع. جرّب تاني.');
        setBusy(false);
        return;
      }
      window.location.href = data.checkout_url; // redirect to Paymob's checkout page
    } catch (e) {
      console.error('payment start failed', e);
      setErrorText('حصلت مشكلة وإحنا بنبدأ الدفع. جرّب تاني.');
      setBusy(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" dir="rtl">
        <button className="modal-close" onClick={onClose} aria-label="إغلاق">
          <Icon name="close" size={20} />
        </button>

        <div className="modal-icon">
          <Icon name="ticket" size={26} />
        </div>
        <span className="eyebrow green">احجز تذكرتك</span>
        <h2 id="modal-title">ادفع واستلم تذكرة QR.</h2>
        <p className="modal-copy">
          الدفع هنا تجريبي ومفيش أي فلوس بتتسحب. التذكرة بتشتغل على بوابة {brand.name} التجريبية بس.
        </p>

        <div className="modal-route">
          <div>
            <small>من</small>
            <strong>{from}</strong>
          </div>
          <Icon name="arrow" size={20} />
          <div>
            <small>إلى</small>
            <strong>{to}</strong>
          </div>
        </div>

        <div className="pay-options" role="radiogroup" aria-label="نوع التذكرة">
          {(Object.keys(ticketKindLabels) as TicketKind[]).map((k) => (
            <button
              key={k}
              role="radio"
              aria-checked={kind === k}
              className={`pay-option ${kind === k ? 'active' : ''}`}
              onClick={() => chooseKind(k)}
              disabled={busy}
            >
              {ticketKindLabels[k]}
            </button>
          ))}
        </div>

        {kind === 'half' &&
          (halfAllowed && verification?.category ? (
            <p className="modal-copy kind-note">
              حسابك موثّق ({categoryLabels[verification.category]}) لحد {verification.until}.
            </p>
          ) : (
            <>
              <p className="modal-copy kind-note">
                نصف التذكرة لـ {halfTicketEligibility}، وبيحتاج توثيق حسابك الأول.
              </p>
              <button
                className="outline-button full"
                onClick={onVerify}
                disabled={busy}
              >
                وثّق حسابك
              </button>
            </>
          ))}

        <div className="modal-price">
          <span>عدد الركاب</span>
          <span>
            <button
              className="outline-button"
              aria-label="تقليل عدد الركاب"
              onClick={() => setPassengers((p) => Math.max(1, p - 1))}
              disabled={busy || kind === 'half' || passengers <= 1}
            >
              −
            </button>
            <strong> {num(passengers)} </strong>
            <button
              className="outline-button"
              aria-label="زيادة عدد الركاب"
              onClick={() => setPassengers((p) => Math.min(MAX_PASSENGERS, p + 1))}
              disabled={busy || kind === 'half' || passengers >= MAX_PASSENGERS}
            >
              +
            </button>
          </span>
        </div>

        <div className="modal-price">
          <span>السعر الإجمالي{passengers > 1 ? ` (${num(unitPrice)} جنيه للراكب)` : ''}</span>
          <strong>{num(price)} جنيه</strong>
        </div>

        <label className="name-label" htmlFor="rider-name">
          اسم الراكب
        </label>
        <input
          id="rider-name"
          className="name-input"
          placeholder="الاسم اللي هيتكتب على التذكرة"
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />

        {errorText && (
          <p className="modal-copy" role="alert">
            {errorText}
          </p>
        )}

        <button
          className="dark-button full modal-action"
          disabled={!name.trim() || busy || blockedHalf}
          onClick={submit}
        >
          {busy ? (
            'جاري التحويل للدفع…'
          ) : (
            <>
              ادفع {num(price)} جنيه <Icon name="arrow" size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
