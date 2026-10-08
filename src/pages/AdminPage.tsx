import { useEffect, useState } from 'react';
import Stat from '../components/Stat';
import { getStationName } from '../components/StationPicker';
import { useLanguage } from '../i18n/LanguageContext';
import { adminData, type DbProfile, type DbSubscription, type DbTicket } from '../lib/db';
import { formatDateTime, num } from '../lib/format';
import { planLabel, zoneLabel } from '../lib/ticketing';
import {
  categoryLabels,
  documentUrl,
  pendingRequests,
  reviewRequest,
  type PendingRequest,
} from '../lib/verification';
import { mostCommon } from './DashboardPage';

type AdminDataState = { users: DbProfile[]; tickets: DbTicket[]; subscriptions: DbSubscription[] };

export default function AdminPage() {
  const { t, locale, lang } = useLanguage();
  const isAr = lang === 'ar';
  const [data, setData] = useState<AdminDataState | null>(null);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    adminData().then(setData);
    void pendingRequests().then(setRequests);
  }, []);

  const openDocument = async (path: string) => {
    // Open the tab first so the browser doesn't block it, then point it at the short-lived link.
    const tab = window.open('', '_blank');
    const url = await documentUrl(path);
    if (url && tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      tab?.close();
      setReviewError(t('admin.docError'));
    }
  };

  const decide = async (id: string, approve: boolean) => {
    setWorkingId(id);
    setReviewError(null);
    const result = await reviewRequest(id, approve);
    setWorkingId(null);
    if (result.ok) setRequests((current) => current.filter((r) => r.id !== id));
    else setReviewError(result.error ?? t('admin.opFailed'));
  };

  if (!data) {
    return (
      <div className="subpage">
        <p className="auth-sub">{t('common.loading')}</p>
      </div>
    );
  }

  const ticketRevenue = data.tickets.reduce((sum, t) => sum + t.fare, 0);
  const subscriptionRevenue = data.subscriptions.reduce((sum, s) => sum + s.fare, 0);
  const revenue = ticketRevenue + subscriptionRevenue;
  const now = Date.now();
  const activeSubscriptions = data.subscriptions.filter(
    (s) => new Date(s.expires_at).getTime() > now && s.trips_used < s.trips_total,
  ).length;

  const topStationName = mostCommon(data.tickets.map((t) => t.to_station));
  const displayTopStation = topStationName ? getStationName(topStationName, lang) : '—';

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">{t('admin.eyebrow')}</span>
        <h1>{t('admin.title')}</h1>
        <p>{t('admin.intro')}</p>
      </div>

      <div className="stat-grid">
        <Stat label={t('admin.statUsers')} value={num(data.users.length, locale)} />
        <Stat label={t('admin.statTickets')} value={num(data.tickets.length, locale)} />
        <Stat label={t('admin.statActiveSubs')} value={num(activeSubscriptions, locale)} />
        <Stat label={t('admin.statRevenue')} value={num(revenue, locale)} unit={t('common.egp')} />
        <Stat label={t('admin.statTopStation')} value={displayTopStation} />
      </div>

      <div className="network-card">
        <h3>{t('admin.requests', { n: num(requests.length, locale) })}</h3>
        {requests.length === 0 ? (
          <p>{t('admin.noRequests')}</p>
        ) : (
          <ul className="gate-list">
            {requests.map((r) => (
              <li key={r.id}>
                <div>
                  <strong>{r.full_name}</strong>
                  <small>
                    {isAr
                      ? categoryLabels[r.category]
                      : r.category === 'senior'
                      ? 'Seniors (over 60)'
                      : 'People with disabilities'}{' '}
                    · {formatDateTime(r.created_at, locale)}
                  </small>
                </div>
                <button className="outline-button" onClick={() => openDocument(r.doc_path)}>
                  {t('admin.viewDoc')}
                </button>
                <button className="dark-button" disabled={workingId === r.id} onClick={() => decide(r.id, true)}>
                  {t('admin.approve')}
                </button>
                <button className="outline-button" disabled={workingId === r.id} onClick={() => decide(r.id, false)}>
                  {t('admin.reject')}
                </button>
              </li>
            ))}
          </ul>
        )}
        {reviewError && <p className="gate-error">{reviewError}</p>}
      </div>

      <div className="network-card">
        <h3>{t('admin.latestSubs', { n: num(data.subscriptions.length, locale) })}</h3>
        {data.subscriptions.length === 0 ? (
          <p>{t('admin.noSubs')}</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('admin.colHolder')}</th>
                  <th>{t('admin.colPlan')}</th>
                  <th>{t('admin.colZone')}</th>
                  <th>{t('admin.colTrips')}</th>
                  <th>{t('admin.colPrice')}</th>
                  <th>{t('admin.colExpires')}</th>
                  <th>{t('admin.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {data.subscriptions.slice(0, 15).map((s) => {
                  const left = s.trips_total - s.trips_used;
                  const expired = new Date(s.expires_at).getTime() <= now;
                  const status = expired
                    ? t('admin.statusExpired')
                    : left <= 0
                    ? t('admin.statusNoTrips')
                    : t('admin.statusActive');
                  const pName = isAr
                    ? planLabel(s.plan)
                    : s.plan === 'weekly'
                    ? 'Weekly'
                    : s.plan === 'monthly'
                    ? 'Monthly'
                    : 'Quarterly';
                  const zName = isAr
                    ? zoneLabel(s.zone)
                    : s.zone === 0
                    ? 'One zone'
                    : s.zone === 1
                    ? 'Two zones'
                    : s.zone === 2
                    ? 'Three zones'
                    : 'Four zones';
                  return (
                    <tr key={s.id}>
                      <td>{s.holder_name}</td>
                      <td>{pName}</td>
                      <td>{zName}</td>
                      <td>
                        {t('admin.tripsLeft', {
                          left: num(Math.max(left, 0), locale),
                          total: num(s.trips_total, locale),
                        })}
                      </td>
                      <td>{num(s.fare, locale)}</td>
                      <td>{formatDateTime(s.expires_at, locale)}</td>
                      <td>{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="network-layout">
        <div className="network-card">
          <h3>{t('admin.latestTickets')}</h3>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('admin.colRider')}</th>
                  <th>{t('admin.colTrip')}</th>
                  <th>{t('admin.colPrice')}</th>
                  <th>{t('admin.colTime')}</th>
                </tr>
              </thead>
              <tbody>
                {data.tickets.slice(0, 15).map((tkt) => (
                  <tr key={tkt.id}>
                    <td>{tkt.rider_name}</td>
                    <td>
                      {getStationName(tkt.from_station, lang)} {isAr ? '←' : '→'} {getStationName(tkt.to_station, lang)}
                    </td>
                    <td>{num(tkt.fare, locale)}</td>
                    <td>{formatDateTime(tkt.created_at, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="network-card">
          <h3>{t('admin.statUsers')}</h3>
          <ul className="gate-list">
            {data.users.slice(0, 12).map((u) => (
              <li key={u.id}>
                <div>
                  <strong>{u.full_name || t('admin.noName')}</strong>
                  <small>
                    {u.role === 'admin' ? t('admin.roleAdmin') : t('admin.roleUser')} · {formatDateTime(u.created_at, locale)}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
