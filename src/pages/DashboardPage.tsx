import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Stat from '../components/Stat';
import { getStationName } from '../components/StationPicker';
import { useLanguage } from '../i18n/LanguageContext';
import { myTickets, type DbTicket } from '../lib/db';
import { formatDateTime, num } from '../lib/format';

/** Most frequent value in a list ('—' when empty). */
export const mostCommon = (items: string[]) => {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
};

export default function DashboardPage({ onPlan }: { onPlan: () => void }) {
  const { t, locale, lang } = useLanguage();
  const { user, profile, updateName, signOut } = useAuth();
  const [tickets, setTickets] = useState<DbTicket[] | null>(null);
  const [name, setName] = useState(profile?.full_name ?? '');
  const [message, setMessage] = useState('');

  const isAr = lang === 'ar';

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

  const save = async () => setMessage((await updateName(name.trim())) ?? (isAr ? 'اتحفظ ✓' : 'Saved ✓'));

  const favouriteStation = stats.favourite !== '—' ? getStationName(stats.favourite, lang) : '—';

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">{isAr ? 'لوحة التحكم' : 'Dashboard'}</span>
        <h1>
          {isAr
            ? `أهلًا ${profile?.full_name || 'بيك'} 👋`
            : `Welcome ${profile?.full_name || 'back'} 👋`}
        </h1>
        <p>
          {user?.email}
          {profile?.role === 'admin' && (isAr ? ' · أدمن' : ' · Admin')}
        </p>
      </div>

      <div className="stat-grid">
        <Stat label={isAr ? 'عدد التذاكر' : 'Number of Tickets'} value={num(stats.count, locale)} />
        <Stat label={isAr ? 'إجمالي المصروف' : 'Total Spent'} value={num(stats.spent, locale)} unit={t('common.egp')} />
        <Stat label={isAr ? 'محطات اتقطعت' : 'Stations Traveled'} value={num(stats.stops, locale)} />
        <Stat label={isAr ? 'محطتك المفضلة' : 'Favorite Station'} value={favouriteStation} />
      </div>

      <div className="network-layout">
        <div className="network-card">
          <div className="network-header">
            <h2>{isAr ? 'آخر رحلاتك' : 'Recent Trips'}</h2>
            <button className="outline-button no-margin" onClick={onPlan}>
              {isAr ? 'رحلة جديدة' : 'New Trip'}
            </button>
          </div>
          {tickets === null ? (
            <p className="auth-sub">{t('common.loading')}</p>
          ) : tickets.length === 0 ? (
            <p className="auth-sub">{isAr ? 'لسه ماحجزتش أي تذكرة.' : 'No tickets booked yet.'}</p>
          ) : (
            <ul className="gate-list">
              {tickets.slice(0, 8).map((tkt) => (
                <li key={tkt.id}>
                  <div>
                    <strong>
                      {getStationName(tkt.from_station, lang)} ← {getStationName(tkt.to_station, lang)}
                    </strong>
                    <small>
                      {tkt.id} · {formatDateTime(tkt.created_at, locale)}
                    </small>
                  </div>
                  <strong>{num(tkt.fare, locale)} {t('common.egp')}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="network-card">
          <h3>{isAr ? 'بياناتي' : 'My Profile'}</h3>
          <label className="name-label" htmlFor="p-name">
            {isAr ? 'الاسم' : 'Full Name'}
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
            {isAr ? 'حفظ' : 'Save'}
          </button>
          {message && <p className="auth-note">{message}</p>}
          <button className="outline-button full" onClick={() => void signOut()}>
            {isAr ? 'تسجيل الخروج' : 'Sign out'}
          </button>
        </aside>
      </div>
    </div>
  );
}
