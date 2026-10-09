import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../config/brand';
import { fareForStops, halfTicketEligibility, ticketKindLabels, type TicketKind } from '../data/fares';
import { useLanguage } from '../i18n/LanguageContext';
import { num } from '../lib/format';
import type { Route } from '../lib/routing';
import { supabase } from '../lib/supabase';
import { categoryLabels, myVerification, type MyVerification } from '../lib/verification';
import Icon from './Icon';
import { getStationName } from './StationPicker';

const MAX_PASSENGERS = 7;
/** Advance booking: how many days ahead a ticket can be bought. Same limit as the server. */
const MAX_ADVANCE_DAYS = 15;

// Dates are YYYY-MM-DD in Cairo time, the same way the server counts them.
const cairoDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Cairo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const todayCairo = () => cairoDateFmt.format(new Date());
const addDays = (dateStr: string, days: number) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

type Props = { route: Route; onClose: () => void; onVerify: () => void };

/** Reads the `error` code our Edge Function sends back (e.g. half_requires_verification). */
async function errorCode(error: unknown): Promise<string | null> {
  const res = (error as { context?: Response } | null)?.context;
  if (!res || typeof res.json !== 'function') return null;
  const body = await res.json().catch(() => null);
  return typeof body?.error === 'string' ? body.error : null;
}

const errorMessagesAr: Record<string, string> = {
  half_requires_verification: 'نصف التذكرة محتاج توثيق ساري لحسابك لحد يوم السفر.',
  half_single_passenger: 'نصف التذكرة لراكب واحد بس.',
  invalid_date: 'التاريخ لازم يكون من النهارده لحد ١٥ يوم قدام.',
};

const errorMessagesEn: Record<string, string> = {
  half_requires_verification: 'Half fare requires account verification that is still valid on the travel day.',
  half_single_passenger: 'Half fare is for one passenger only.',
  invalid_date: 'The date must be between today and 15 days ahead.',
};

export default function TicketModal({ route, onClose, onVerify }: Props) {
  const { lang, dir, locale } = useLanguage();
  const isAr = lang === 'ar';
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [kind, setKind] = useState<TicketKind>('full');
  const [passengers, setPassengers] = useState(1);
  const today = todayCairo();
  const maxDate = addDays(today, MAX_ADVANCE_DAYS);
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [verification, setVerification] = useState<MyVerification | null>(null);

  const unitPrice = fareForStops(route.stops, kind);
  const price = unitPrice * passengers;
  const rawFrom = route.names[0];
  const rawTo = route.names[route.names.length - 1];
  const fromName = getStationName(rawFrom, lang);
  const toName = getStationName(rawTo, lang);
  const halfAllowed = Boolean(verification?.category);
  const blockedHalf = kind === 'half' && !halfAllowed;
  // The date input can be typed by hand, so check the range here too (the server checks it again).
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= today && date <= maxDate;
  const isAdvance = dateOk && date > today;

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
      if (!user) {
        setErrorText(isAr ? 'سجّل دخولك الأول لحسابك عشان تقدر تحجز وتدفع.' : 'Please sign in to your account first to book and pay.');
        setBusy(false);
        return;
      }
      if (!supabase) throw new Error('Supabase not connected');
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          name: name.trim(),
          from: rawFrom,
          to: rawTo,
          kind,
          passengers,
          // Only send a date for a real advance booking; "today" keeps the normal behaviour.
          ...(isAdvance ? { date } : {}),
        },
      });
      if (error || !data?.checkout_url) {
        const code = await errorCode(error);
        const errMap = isAr ? errorMessagesAr : errorMessagesEn;
        const fallbackErr = isAr
          ? 'حصلت مشكلة وإحنا بنبدأ الدفع. جرّب تاني.'
          : 'An error occurred while initiating payment. Please try again.';
        setErrorText((code && errMap[code]) || fallbackErr);
        setBusy(false);
        return;
      }
      window.location.href = data.checkout_url; // redirect to Paymob's checkout page
    } catch (e) {
      console.error('payment start failed', e);
      setErrorText(isAr ? 'حصلت مشكلة وإحنا بنبدأ الدفع. جرّب تاني.' : 'An error occurred while initiating payment. Please try again.');
      setBusy(false);
    }
  };

  const categoryName = verification?.category
    ? isAr
      ? categoryLabels[verification.category]
      : verification.category === 'senior'
      ? 'Seniors (over 60)'
      : 'People with disabilities'
    : '';

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" dir={dir}>
        <button className="modal-close" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'}>
          <Icon name="close" size={20} />
        </button>

        <div className="modal-icon">
          <Icon name="ticket" size={26} />
        </div>
        <span className="eyebrow green">{isAr ? 'احجز تذكرتك' : 'Book Your Ticket'}</span>
        <h2 id="modal-title">{isAr ? 'ادفع واستلم تذكرة QR.' : 'Pay & Receive QR Ticket.'}</h2>
        <p className="modal-copy">
          {isAr
            ? `الدفع هنا تجريبي ومفيش أي فلوس بتتسحب. التذكرة بتشتغل على بوابة ${brand.name} التجريبية بس.`
            : `Payment here is a demo and no money is charged. The ticket works on the ${brand.name} demo gate only.`}
        </p>

        <div className="modal-route">
          <div>
            <small>{isAr ? 'من' : 'From'}</small>
            <strong>{fromName}</strong>
          </div>
          <Icon name="arrow" size={20} />
          <div>
            <small>{isAr ? 'إلى' : 'To'}</small>
            <strong>{toName}</strong>
          </div>
        </div>

        <div className="pay-options" role="radiogroup" aria-label={isAr ? 'نوع التذكرة' : 'Ticket Type'}>
          {(Object.keys(ticketKindLabels) as TicketKind[]).map((k) => (
            <button
              key={k}
              role="radio"
              aria-checked={kind === k}
              className={`pay-option ${kind === k ? 'active' : ''}`}
              onClick={() => chooseKind(k)}
              disabled={busy}
            >
              {isAr ? ticketKindLabels[k] : k === 'full' ? 'Full ticket' : 'Half ticket'}
            </button>
          ))}
        </div>

        {kind === 'half' &&
          (halfAllowed && verification?.category ? (
            <p className="modal-copy kind-note">
              {isAr
                ? `حسابك موثّق (${categoryName}) لحد ${verification.until}.`
                : `Your account is verified (${categoryName}) until ${verification.until}.`}
            </p>
          ) : (
            <>
              <p className="modal-copy kind-note">
                {isAr
                  ? `نصف التذكرة لـ ${halfTicketEligibility}، وبيحتاج توثيق حسابك الأول.`
                  : 'Half ticket is for seniors over 60 & riders with disabilities, requiring account verification.'}
              </p>
              <button
                className="outline-button full"
                onClick={onVerify}
                disabled={busy}
              >
                {isAr ? 'وثّق حسابك' : 'Verify Your Account'}
              </button>
            </>
          ))}

        <label className="name-label" htmlFor="travel-date">
          {isAr ? 'تاريخ السفر' : 'Travel Date'}
        </label>
        <input
          id="travel-date"
          className="name-input"
          type="date"
          dir="ltr"
          min={today}
          max={maxDate}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={busy}
        />
        <p className="modal-copy kind-note">
          {!dateOk
            ? isAr
              ? 'اختار تاريخ من النهارده لحد ١٥ يوم قدام.'
              : 'Pick a date from today up to 15 days ahead.'
            : isAdvance
              ? isAr
                ? 'التذكرة بتشتغل في اليوم ده بس، من أوله لآخره.'
                : 'The ticket works on that day only, from start to end.'
              : isAr
                ? 'التذكرة بتشتغل من وقت الدفع لمدة ساعتين.'
                : 'The ticket works for two hours from payment.'}
        </p>

        <div className="modal-price">
          <span>{isAr ? 'عدد الركاب' : 'Passengers'}</span>
          <span>
            <button
              className="outline-button"
              aria-label={isAr ? 'تقليل عدد الركاب' : 'Decrease passengers'}
              onClick={() => setPassengers((p) => Math.max(1, p - 1))}
              disabled={busy || kind === 'half' || passengers <= 1}
            >
              −
            </button>
            <strong> {num(passengers, locale)} </strong>
            <button
              className="outline-button"
              aria-label={isAr ? 'زيادة عدد الركاب' : 'Increase passengers'}
              onClick={() => setPassengers((p) => Math.min(MAX_PASSENGERS, p + 1))}
              disabled={busy || kind === 'half' || passengers >= MAX_PASSENGERS}
            >
              +
            </button>
          </span>
        </div>

        <div className="modal-price">
          <span>
            {isAr
              ? `السعر الإجمالي${passengers > 1 ? ` (${num(unitPrice, locale)} جنيه للراكب)` : ''}`
              : `Total Price${passengers > 1 ? ` (${num(unitPrice, locale)} EGP / rider)` : ''}`}
          </span>
          <strong>{num(price, locale)} {isAr ? 'جنيه' : 'EGP'}</strong>
        </div>

        <label className="name-label" htmlFor="rider-name">
          {isAr ? 'اسم الراكب' : 'Passenger Name'}
        </label>
        <input
          id="rider-name"
          className="name-input"
          placeholder={isAr ? 'الاسم اللي هيتكتب على التذكرة' : 'Name to appear on the ticket'}
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
          disabled={!name.trim() || busy || blockedHalf || !dateOk}
          onClick={submit}
        >
          {busy ? (
            isAr ? 'جاري التحويل للدفع…' : 'Redirecting to payment…'
          ) : (
            <>
              {isAr ? `ادفع ${num(price, locale)} جنيه` : `Pay ${num(price, locale)} EGP`} <Icon name="arrow" size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
