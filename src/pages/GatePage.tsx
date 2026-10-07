import { useState } from 'react';
import Icon from '../components/Icon';
import { getStationName } from '../components/StationPicker';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { num } from '../lib/format';

type SavedSubscription = {
  id: string;
  plan: string;
  zone: number;
  tripsLeft: number;
  tripsTotal: number;
  payload: string;
};

type SavedTicket = {
  id: string;
  route: string;
  fare: number;
  payload: string;
};

type Result = { ok: boolean; message: string };

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

export default function GatePage() {
  const { user } = useAuth();
  const { lang, locale, t } = useLanguage();
  const [result, setResult] = useState<Result | null>(null);
  const isAr = lang === 'ar';

  const getSavedSubs = (): SavedSubscription[] => {
    if (!user) return [];
    try {
      const raw = localStorage.getItem(`monogo_subs_${user.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const getSavedTickets = (): SavedTicket[] => {
    if (!user) return [];
    try {
      const raw = localStorage.getItem(`monogo_tickets_${user.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const subs = getSavedSubs();
  const tickets = getSavedTickets();

  const translateRoute = (routeText: string) => {
    if (!routeText.includes('←')) return getStationName(routeText, lang);
    const [from, to] = routeText.split('←').map((s) => s.trim());
    return `${getStationName(from, lang)} ← ${getStationName(to, lang)}`;
  };

  const simulateScan = (payload: string, label: string) => {
    if (payload.includes('FORGED') || payload.includes('INVALID')) {
      setResult({ ok: false, message: isAr ? 'رمز مزوّر أو غير صالح' : 'Forged or invalid code' });
    } else {
      setResult({ ok: true, message: `${isAr ? 'تم قبول' : 'Accepted'}: ${label}` });
    }
  };

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">{t('gate.eyebrow')}</span>
        <h1>{t('gate.title')}</h1>
        <p>{user ? t('gate.introStaff') : t('gate.introRider')}</p>
      </div>

      {result && (
        <div className={`result-card gate-result ${result.ok ? 'ok' : 'fail'}`}>
          <div className="card-icon">
            <Icon name={result.ok ? 'check' : 'close'} size={24} />
          </div>
          <h3>{result.ok ? t('gate.verified') : t('gate.stayedClosed')}</h3>
          <p>{result.message}</p>
        </div>
      )}

      {user && (
        <div className="gate-list-section">
          {subs.length > 0 && (
            <div className="wallet-section">
              <h3>{isAr ? 'اشتراكاتك' : 'Your subscriptions'}</h3>
              <div className="gate-items">
                {subs.map((s) => {
                  const pName = planNames[s.plan]?.[lang] || s.plan;
                  const zName = zoneNames[s.zone]?.[lang] || s.zone;
                  const subTitle = isAr ? `${pName} · ${zName}` : `${pName} subscription · ${zName}`;
                  return (
                    <button key={s.id} className="gate-item-btn" onClick={() => simulateScan(s.payload, subTitle)}>
                      <div>
                        <strong>{subTitle}</strong>
                        <small>
                          {s.id} · {isAr ? `باقي ${num(s.tripsLeft, locale)} من ${num(s.tripsTotal, locale)} رحلة` : `${num(s.tripsLeft, locale)} of ${num(s.tripsTotal, locale)} trips left`}
                        </small>
                      </div>
                      <span className="scan-pill">{t('gate.scan')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tickets.length > 0 && (
            <div className="wallet-section">
              <h3>{isAr ? 'تذاكرك' : 'Your tickets'}</h3>
              <div className="gate-items">
                {tickets.map((tItem) => {
                  const routeName = translateRoute(tItem.route);
                  return (
                    <button key={tItem.id} className="gate-item-btn" onClick={() => simulateScan(tItem.payload, routeName)}>
                      <div>
                        <strong>{routeName}</strong>
                        <small>
                          {tItem.id} · {num(tItem.fare, locale)} {t('common.egp')}
                        </small>
                      </div>
                      <span className="scan-pill">{t('gate.scan')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
