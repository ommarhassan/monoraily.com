import { useAuth } from '../auth/AuthContext';
import { brand } from '../config/brand';
import { formatTime } from '../lib/format';
import { pageTitle, type Page } from '../navigation';
import Icon from './Icon';
import WeatherBadge from './WeatherBadge';

type Props = {
  page: Page;
  now: Date;
  onOpenMenu: () => void;
  onGo: (page: Page) => void;
  onLogin: () => void;
  onRegister: () => void;
  onSignOut: () => void;
};

export default function Topbar({ page, now, onOpenMenu, onGo, onLogin, onRegister, onSignOut }: Props) {
  const { user, profile } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-right">
        <button className="mobile-menu" aria-label="فتح القائمة" onClick={onOpenMenu}>
          <Icon name="menu" size={22} />
        </button>
        <span className="breadcrumb">{brand.name}</span>
        <Icon name="chevron" size={14} />
        <strong>{pageTitle(page)}</strong>
      </div>

      <div className="topbar-left">
        <span className="live-clock">
          <span className="live-dot" /> توقيت القاهرة <strong>{formatTime(now)}</strong>
        </span>
        <WeatherBadge />
        {user ? (
          <>
            <button className="topbar-user" onClick={() => onGo('dashboard')}>
              <Icon name="user" size={17} />
              {profile?.full_name || 'حسابي'}
            </button>
            <button className="topbar-link" onClick={onSignOut}>
              خروج
            </button>
          </>
        ) : (
          <>
            <button className="topbar-link" onClick={onLogin}>
              تسجيل الدخول
            </button>
            <button className="topbar-user filled" onClick={onRegister}>
              حساب جديد
            </button>
          </>
        )}
      </div>
    </header>
  );
}
