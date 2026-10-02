import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Stat from '../components/Stat';
import { myTickets, type DbTicket } from '../lib/db';
import { formatDateTime, num } from '../lib/format';

/** Most frequent value in a list ('—' when empty). */
export const mostCommon = (items: string[]) => {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
};

export default function DashboardPage({ onPlan }: { onPlan: () => void }) {
  const { user, profile, updateName, signOut } = useAuth();
  const [tickets, setTickets] = useState<DbTicket[] | null>(null);
  const [name, setName] = useState(profile?.full_name ?? '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    myTickets().then(setTickets);
  }, []);
  useEffect(() => {
    if (profile) setName(profile.full_name);
  }, [profile]);

  const stats = useMemo(() => {
    const list = tickets ?? [];
    return {
      count: list.length,
      spent: list.reduce((sum, t) => sum + t.fare, 0),
      stops: list.reduce((sum, t) => sum + t.stops, 0),
      favourite: mostCommon(list.flatMap((t) => [t.from_station, t.to_station])),
    };
  }, [tickets]);

  const save = async () => setMessage((await updateName(name.trim())) ?? 'اتحفظ ✓');

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">لوحة التحكم</span>
        <h1>أهلًا {profile?.full_name || 'بيك'} 👋</h1>
        <p>
          {user?.email}
          {profile?.role === 'admin' && ' · أدمن'}
        </p>
      </div>

      <div className="stat-grid">
        <Stat label="عدد التذاكر" value={num(stats.count)} />
        <Stat label="إجمالي المصروف" value={num(stats.spent)} unit="جنيه" />
        <Stat label="محطات اتقطعت" value={num(stats.stops)} />
        <Stat label="محطتك المفضلة" value={stats.favourite} />
      </div>

      <div className="network-layout">
        <div className="network-card">
          <div className="network-header">
            <h2>آخر رحلاتك</h2>
            <button className="outline-button no-margin" onClick={onPlan}>
              رحلة جديدة
            </button>
          </div>
          {tickets === null ? (
            <p className="auth-sub">بنحمّل…</p>
          ) : tickets.length === 0 ? (
            <p className="auth-sub">لسه ماحجزتش أي تذكرة.</p>
          ) : (
            <ul className="gate-list">
              {tickets.slice(0, 8).map((t) => (
                <li key={t.id}>
                  <div>
                    <strong>
                      {t.from_station} ← {t.to_station}
                    </strong>
                    <small>
                      {t.id} · {formatDateTime(t.created_at)}
                    </small>
                  </div>
                  <strong>{num(t.fare)} ج</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="network-card">
          <h3>بياناتي</h3>
          <label className="name-label" htmlFor="p-name">
            الاسم
          </label>
          <input
            id="p-name"
            className="name-input"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="dark-button full modal-action"
            disabled={name.trim().length < 2 || name.trim() === profile?.full_name}
            onClick={save}
          >
            حفظ
          </button>
          {message && <p className="auth-note">{message}</p>}
          <button className="outline-button full" onClick={() => void signOut()}>
            تسجيل الخروج
          </button>
        </aside>
      </div>
    </div>
  );
}
