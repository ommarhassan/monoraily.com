import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { getStationName } from '../components/StationPicker';
import { farePlans, type PlanId } from '../data/fares';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { formatDate, formatTime, num } from '../lib/format';

type SavedSubscription = {
  id: string;
  userId: string;
  plan: PlanId;
  zone: number;
  holderName: string;
  tripsLeft: number;
  tripsTotal: number;
  expiresAt: string;
  payload: string;
};

type SavedTicket = {
  id: string;
  userId: string;
  route: string;
  fare: number;
  kind: 'full' | 'half';
  status: 'valid' | 'expired';
  expiresAt: string;
  payload: string;
};

type Props = { onPlan: () => void; justPaid?: string | null };

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

export default function MyTicketsPage({ onPlan, justPaid }: Props) {
  const { user } = useAuth();
  const { lang, locale, t } = useLanguage();
  const [subs, setSubs] = useState<SavedSubscription[]>([]);
  const [tickets, setTickets] = useState<SavedTicket[]>([]);
  const isAr = lang === 'ar';

  useEffect(() => {
    if (!user) return;
    try {
      const rawSubs = localStorage.getItem(`monogo_subs_${user.id}`);
      const rawTickets = localStorage.getItem(`monogo_tickets_${user.id}`);
      if (rawSubs) setSubs(JSON.parse(rawSubs));
      if (rawTickets) setTickets(JSON.parse(rawTickets));
    } catch {
      // ignore
    }
  }, [user]);

  const justPaidSub = justPaid?.startsWith('SUB-') ? subs.find((s) => s.id === justPaid) : null;
  const justPaidTicket = justPaid?.startsWith('MN-') || justPaid?.startsWith('PAY-') ? tickets.find((t) => t.id === justPaid) : null;

  const translateRoute = (routeText: string) => {
    if (!routeText.includes('←')) return getStationName(routeText, lang);
    const [from, to] = routeText.split('←').map((s) => s.trim());
    return `${getStationName(from, lang)} ← ${getStationName(to, lang)}`;
  };

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">{t('tickets.eyebrow')}</span>
        <h1>{t('tickets.title')}</h1>
        <p>{t('tickets.intro')}</p>
      </div>

      {justPaid && (
        <div className="paid-banner">
          <span className="eyebrow green">{t('tickets.paidEyebrow')}</span>
          {justPaidTicket && (
            <>
              <h3>{t('tickets.ticketReady')}</h3>
              <p>{t('tickets.ticketInfo', { route: translateRoute(justPaidTicket.route), id: justPaidTicket.id })}</p>
            </>
          )}
          {justPaidSub && (
            <>
              <h3>{t('tickets.subActivated')}</h3>
              <p>
                {t('tickets.subInfo', {
                  plan: planNames[justPaidSub.plan]?.[lang] || justPaidSub.plan,
                  zone: zoneNames[justPaidSub.zone]?.[lang] || justPaidSub.zone,
                  trips: num(farePlans.find((p) => p.id === justPaidSub.plan)?.trips ?? 0, locale),
                })}
              </p>
            </>
          )}
          {!justPaidTicket && !justPaidSub && (
            <>
              <h3>{t('tickets.waitTitle')}</h3>
              <p>{t('tickets.lateText')}</p>
            </>
          )}
        </div>
      )}

      {subs.length > 0 && (
        <div className="wallet-section">
          <div className="section-title-row">
            <div>
              <span className="eyebrow green">{isAr ? 'الاشتراكات' : 'Subscriptions'}</span>
              <h2>{t('tickets.subsHeading')}</h2>
            </div>
          </div>
          <div className="wallet-grid">
            {subs.map((s) => {
              const active = new Date(s.expiresAt) > new Date() && s.tripsLeft > 0;
              const pName = planNames[s.plan]?.[lang] || s.plan;
              const zName = zoneNames[s.zone]?.[lang] || s.zone;
              const title = isAr ? `اشتراك ${pName} · ${zName}` : `${pName} subscription · ${zName}`;
              const statusTag = active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'منتهي' : 'Expired');
              return (
                <div className="ticket-card" key={s.id}>
                  <div className="ticket-head">
                    <span className={`status-pill ${active ? 'active' : 'expired'}`}>{statusTag}</span>
                    <span className="ticket-id">{s.id}</span>
                  </div>
                  <div className="ticket-qr-wrap" style={{ textAlign: 'center', padding: '12px' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(s.payload || s.id)}`}
                      alt={s.id}
                      width={160}
                      height={160}
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                  <div className="ticket-body">
                    <h3>{title}</h3>
                    <p>
                      {s.holderName} · {isAr ? `باقي ${num(s.tripsLeft, locale)} من ${num(s.tripsTotal, locale)} رحلة` : `${num(s.tripsLeft, locale)} of ${num(s.tripsTotal, locale)} trips left`}
                    </p>
                    <small>
                      {isAr ? `ينتهي ${formatDate(s.expiresAt, locale)} الساعة ${formatTime(s.expiresAt, locale)}` : `expires ${formatDate(s.expiresAt, locale)} at ${formatTime(s.expiresAt, locale)}`}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="wallet-section">
          <div className="section-title-row">
            <div>
              <span className="eyebrow green">{isAr ? 'التذاكر' : 'Tickets'}</span>
              <h2>{t('tickets.ticketsHeading')}</h2>
            </div>
          </div>
          <div className="wallet-grid">
            {tickets.map((tItem) => {
              const active = tItem.status === 'valid';
              const kindLabel = tItem.kind === 'half' ? (isAr ? 'نصف تذكرة' : 'Half ticket') : (isAr ? 'تذكرة كاملة' : 'Full ticket');
              const statusTag = active ? (isAr ? 'صالحة' : 'Valid') : (isAr ? 'منتهية' : 'Expired');
              return (
                <div className="ticket-card" key={tItem.id}>
                  <div className="ticket-head">
                    <span className={`status-pill ${active ? 'active' : 'expired'}`}>{statusTag}</span>
                    <span className="ticket-id">{tItem.id}</span>
                  </div>
                  <div className="ticket-qr-wrap" style={{ textAlign: 'center', padding: '12px' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(tItem.payload || tItem.id)}`}
                      alt={tItem.id}
                      width={160}
                      height={160}
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                  <div className="ticket-body">
                    <h3>{translateRoute(tItem.route)}</h3>
                    <p>
                      {kindLabel} · {num(tItem.fare, locale)} {t('common.egp')}
                    </p>
                    <small>
                      {isAr ? `تنتهي ${formatDate(tItem.expiresAt, locale)} الساعة ${formatTime(tItem.expiresAt, locale)}` : `expires ${formatDate(tItem.expiresAt, locale)} at ${formatTime(tItem.expiresAt, locale)}`}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subs.length === 0 && tickets.length === 0 && !justPaid && (
        <div className="result-card empty-result">
          <div className="empty-illustration">
            <Icon name="ticket" size={48} />
          </div>
          <span className="eyebrow green">{t('tickets.emptyEyebrow')}</span>
          <h3>{t('tickets.emptyTitle')}</h3>
          <p>{t('tickets.emptyText')}</p>
          <button className="dark-button" onClick={onPlan}>
            {t('tickets.newTrip')}
          </button>
        </div>
      )}
    </div>
  );
}
