import { useEffect, useState } from 'react';
import Stat from '../components/Stat';
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
      setReviewError('مقدرناش نفتح المستند.');
    }
  };

  const decide = async (id: string, approve: boolean) => {
    setWorkingId(id);
    setReviewError(null);
    const result = await reviewRequest(id, approve);
    setWorkingId(null);
    if (result.ok) setRequests((current) => current.filter((r) => r.id !== id));
    else setReviewError(result.error ?? 'العملية فشلت.');
  };

  if (!data) {
    return (
      <div className="subpage">
        <p className="auth-sub">بنحمّل…</p>
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

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">الإدارة</span>
        <h1>لوحة الأدمن</h1>
        <p>نظرة عامة على المستخدمين والتذاكر والاشتراكات.</p>
      </div>

      <div className="stat-grid">
        <Stat label="المستخدمين" value={num(data.users.length)} />
        <Stat label="التذاكر" value={num(data.tickets.length)} />
        <Stat label="الاشتراكات النشطة" value={num(activeSubscriptions)} />
        <Stat label="إجمالي الإيرادات" value={num(revenue)} unit="جنيه" />
        <Stat label="أكثر محطة طلبًا" value={mostCommon(data.tickets.map((t) => t.to_station))} />
      </div>

      <div className="network-card">
        <h3>طلبات التوثيق ({num(requests.length)})</h3>
        {requests.length === 0 ? (
          <p>مفيش طلبات قيد المراجعة.</p>
        ) : (
          <ul className="gate-list">
            {requests.map((r) => (
              <li key={r.id}>
                <div>
                  <strong>{r.full_name}</strong>
                  <small>
                    {categoryLabels[r.category]} · {formatDateTime(r.created_at)}
                  </small>
                </div>
                <button className="outline-button" onClick={() => openDocument(r.doc_path)}>
                  عرض المستند
                </button>
                <button className="dark-button" disabled={workingId === r.id} onClick={() => decide(r.id, true)}>
                  موافقة
                </button>
                <button className="outline-button" disabled={workingId === r.id} onClick={() => decide(r.id, false)}>
                  رفض
                </button>
              </li>
            ))}
          </ul>
        )}
        {reviewError && <p className="gate-error">{reviewError}</p>}
      </div>

      <div className="network-card">
        <h3>آخر الاشتراكات ({num(data.subscriptions.length)})</h3>
        {data.subscriptions.length === 0 ? (
          <p>مفيش اشتراكات لسه.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>صاحب الاشتراك</th>
                  <th>الباقة</th>
                  <th>المنطقة</th>
                  <th>الرحلات</th>
                  <th>السعر</th>
                  <th>ينتهي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {data.subscriptions.slice(0, 15).map((s) => {
                  const left = s.trips_total - s.trips_used;
                  const expired = new Date(s.expires_at).getTime() <= now;
                  const status = expired ? 'منتهي' : left <= 0 ? 'الرحلات خلصت' : 'نشط';
                  return (
                    <tr key={s.id}>
                      <td>{s.holder_name}</td>
                      <td>{planLabel(s.plan)}</td>
                      <td>{zoneLabel(s.zone)}</td>
                      <td>
                        باقي {num(Math.max(left, 0))} من {num(s.trips_total)}
                      </td>
                      <td>{num(s.fare)}</td>
                      <td>{formatDateTime(s.expires_at)}</td>
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
          <h3>آخر التذاكر</h3>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الراكب</th>
                  <th>الرحلة</th>
                  <th>السعر</th>
                  <th>الوقت</th>
                </tr>
              </thead>
              <tbody>
                {data.tickets.slice(0, 15).map((t) => (
                  <tr key={t.id}>
                    <td>{t.rider_name}</td>
                    <td>
                      {t.from_station} ← {t.to_station}
                    </td>
                    <td>{num(t.fare)}</td>
                    <td>{formatDateTime(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="network-card">
          <h3>المستخدمين</h3>
          <ul className="gate-list">
            {data.users.slice(0, 12).map((u) => (
              <li key={u.id}>
                <div>
                  <strong>{u.full_name || 'بدون اسم'}</strong>
                  <small>
                    {u.role === 'admin' ? 'أدمن' : 'مستخدم'} · {formatDateTime(u.created_at)}
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
