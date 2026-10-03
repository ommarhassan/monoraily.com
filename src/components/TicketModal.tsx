import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../config/brand';
import { fareForStops, halfTicketEligibility, ticketKindLabels, type TicketKind } from '../data/fares';
import { saveTicket } from '../lib/db';
import { num } from '../lib/format';
import type { Route } from '../lib/routing';
import { supabase } from '../lib/supabase';
import { issueTicket, qrImage, type Ticket } from '../lib/ticketing';
import Icon from './Icon';

const PAYMENT_METHODS = ['Visa', 'محفظة إلكترونية'];
const FAKE_PAYMENT_DELAY_MS = 1200;
/** true = real Paymob checkout (test mode). false = the old fake payment. */
const USE_PAYMOB = true;

type Step = 'form' | 'paying' | 'issued';

export default function TicketModal({ route, onClose }: { route: Route; onClose: () => void }) {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [pay, setPay] = useState(PAYMENT_METHODS[0]);
  const [kind, setKind] = useState<TicketKind>('full');
  const [step, setStep] = useState<Step>('form');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [qr, setQr] = useState('');
  const [failed, setFailed] = useState(false);

  const price = fareForStops(route.stops, kind);
  const from = route.names[0];
  const to = route.names[route.names.length - 1];

  useEffect(() => {
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const submit = async () => {
    setStep('paying');
    setFailed(false);

    if (USE_PAYMOB) {
      try {
        if (!supabase || !user) throw new Error('not signed in');
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: { name: name.trim(), from, to, stops: route.stops, kind },
        });
        if (error || !data?.checkout_url) throw error ?? new Error('no checkout url');
        window.location.href = data.checkout_url; // redirect to Paymob's checkout page
      } catch (e) {
        console.error('payment start failed', e);
        setFailed(true);
        setStep('form');
      }
      return;
    }

    try {
      const [issued] = await Promise.all([
        issueTicket(route, name.trim(), pay, kind),
        new Promise((resolve) => setTimeout(resolve, FAKE_PAYMENT_DELAY_MS)),
      ]);
      if (user) await saveTicket(issued, user.id);
      setTicket(issued);
      setQr(await qrImage(issued.token));
      setStep('issued');
    } catch {
      setFailed(true);
      setStep('form');
    }
  };

  const busy = step === 'paying';

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

        {step !== 'issued' || !ticket ? (
          <>
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
                  onClick={() => setKind(k)}
                  disabled={busy}
                >
                  {ticketKindLabels[k]}
                </button>
              ))}
            </div>
            {kind === 'half' && <p className="modal-copy kind-note">نصف التذكرة لـ {halfTicketEligibility}.</p>}

            <div className="modal-price">
              <span>السعر الإرشادي للرحلة</span>
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

            <div className="pay-options" role="radiogroup" aria-label="وسيلة الدفع">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  role="radio"
                  aria-checked={pay === method}
                  className={`pay-option ${pay === method ? 'active' : ''}`}
                  onClick={() => setPay(method)}
                  disabled={busy}
                >
                  {method}
                </button>
              ))}
            </div>

            {failed && (
              <p className="modal-copy" role="alert">
                حصلت مشكلة وإحنا بنبدأ الدفع. جرّب تاني.
              </p>
            )}

            <button className="dark-button full modal-action" disabled={!name.trim() || busy} onClick={submit}>
              {busy ? (
                'جاري الدفع…'
              ) : (
                <>
                  ادفع {num(price)} جنيه <Icon name="arrow" size={18} />
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="ticket-preview">
              <div className="ticket-preview-top">
                <span className="ticket-brand">
                  {brand.wordmark[0]}
                  <span>{brand.wordmark[1]}</span>
                  <i>.</i>
                </span>
                <span>{ticket.id}</span>
              </div>
              <div className="ticket-preview-body">
                <span className="eyebrow">{ticketKindLabels[ticket.kind]} · رحلة واحدة · صالحة لمدة ساعتين</span>
                <h2 id="modal-title">رحلة سعيدة، {ticket.name}</h2>
                <div className="ticket-stops">
                  <div>
                    <small>من</small>
                    <strong>{ticket.from}</strong>
                  </div>
                  <Icon name="arrow" size={18} />
                  <div>
                    <small>إلى</small>
                    <strong>{ticket.to}</strong>
                  </div>
                </div>
                <img className="qr-img" src={qr} alt="رمز QR للتذكرة، يُمسح مرة واحدة عند البوابة" />
                <div className="ticket-bottom">
                  <span>
                    {num(ticket.stops)} محطة · {ticket.pay}
                  </span>
                  <strong>{num(ticket.fare)} جنيه</strong>
                </div>
              </div>
            </div>
            <p className="estimate-note center">
              التذكرة اتحفظت على جهازك وبتشتغل من غير إنترنت. امسحها من صفحة «بوابة التحقق».
            </p>
            <button className="outline-button full" onClick={onClose}>
              تمام
            </button>
          </>
        )}
      </div>
    </div>
  );
}
