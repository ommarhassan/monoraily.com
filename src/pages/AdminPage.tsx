import { useEffect, useState } from 'react';
import Stat from '../components/Stat';
import { adminData, type DbProfile, type DbTicket } from '../lib/db';
import { formatDateTime, num } from '../lib/format';
import { mostCommon } from './DashboardPage';

export default function AdminPage() {
  const [data, setData] = useState<{ users: DbProfile[]; tickets: DbTicket[] } | null>(null);

  useEffect(() => {
    adminData().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="subpage">
        <p className="auth-sub">بنحمّل…</p>
      </div>
    );
  }

  const revenue = data.tickets.reduce((sum, t) => sum + t.fare, 0);

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">الإدارة</span>
        <h1>لوحة الأدمن</h1>
        <p>نظرة عامة على المستخدمين والتذاكر.</p>
      </div>

      <div className="stat-grid">
        <Stat label="المستخدمين" value={num(data.users.length)} />
        <Stat label="التذاكر" value={num(data.tickets.length)} />
        <Stat label="إجمالي الإيرادات" value={num(revenue)} unit="جنيه" />
        <Stat label="أكثر محطة طلبًا" value={mostCommon(data.tickets.map((t) => t.to_station))} />
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
