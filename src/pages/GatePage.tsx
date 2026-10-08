import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { getStationName } from '../components/StationPicker';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { mySubscriptions, myTickets } from '../lib/db';
import { num } from '../lib/format';
import { configured } from '../lib/supabase';
import { subFromRow, ticketFromRow, ticketStatus, tripsLeft } from '../lib/ticketing';

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
  const [subs, setSubs] = useState<SavedSubscription[]>([]);
  const [tickets, setTickets] = useState<SavedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const isAr = lang === 'ar';

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Supabase not configured: old local demo behaviour.
    if (!configured) {
      try {
        const rawSubs = localStorage.getItem(`monogo_subs_${user.id}`);
        const rawTickets = localStorage.getItem(`monogo_tickets_${user.id}`);
        if (rawSubs) setSubs(JSON.parse(rawSubs));
        if (rawTickets) setTickets(JSON.parse(rawTickets));
      } catch {
        // ignore
      }
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const [rows, subRows] = await Promise.all([myTickets(), mySubscriptions()]);
        const [ticketList, subList] = await Promise.all([
          Promise.all(rows.map(ticketFromRow)),
          Promise.all(subRows.map(subFromRow)),
        ]);
        if (cancelled) return;

        // Only tickets that can still be scanned.
        setTickets(
          ticketList
            .filter((tk) => ticketStatus(tk) === 'valid')
            .map((tk) => ({
              id: tk.id,
              route: `${tk.from} ← ${tk.to}`,
              fare: tk.fare,
              payload: tk.token,
            })),
        );
        setSubs(
          subList
            .filter((s) => tripsLeft(s) > 0 && s.exp > Date.now())
            .map((s) => ({
              id: s.id,
              plan: s.plan,
              zone: s.zone,
              tripsLeft: tripsLeft(s),
              tripsTotal: s.tripsTotal,
              payload: s.token,
            })),
        );
      } catch {
        // leave the lists empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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

      {user && loading && <p className="auth-sub">{t('common.loading')}</p>}

      {user && !loading && (
        <div className="gate-list-section">
          {subs.length > 0 && (
            <div className="wallet-section">
              <h3>{t('tickets.subsHeading')}</h3>
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
                          {s.id} ·{' '}
                          {isAr
                            ? `باقي ${num(s.tripsLeft, locale)} من ${num(s.tripsTotal, locale)} رحلة`
                            : `${num(s.tripsLeft, locale)} of ${num(s.tripsTotal, locale)} trips left`}
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
              <h3>{t('tickets.ticketsHeading')}</h3>
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

          {subs.length === 0 && tickets.length === 0 && (
            <div className="result-card empty-result">
              <p>{t('gate.noneYet')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
