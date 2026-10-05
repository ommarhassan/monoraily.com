import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../config/brand';
import { formatTime } from '../lib/format';
import { nav, type Page } from '../navigation';
import Icon from './Icon';
import WeatherBadge from './WeatherBadge';

type Props = {
  page: Page;
  now: Date;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onGo: (page: Page) => void;
  onLogin: () => void;
  onRegister: () => void;
  onSignOut: () => void;
};

const dateFormat = new Intl.DateTimeFormat('ar-EG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Africa/Cairo',
});

/** Site header: utility strip (date, clock, weather, account) and the main navigation. */
export default function Topbar({ page, now, menuOpen, onToggleMenu, onGo, onLogin, onRegister, onSignOut }: Props) {
  const { user, profile, isAdmin } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  const go = (target: Page) => {
    setAccountOpen(false);
    onGo(target);
  };

  return (
    <header className="site-header">
      <div className="header-strip">
        <div className="header-inner strip-inner">
          <div className="strip-group">
            <span className="strip-date">{dateFormat.format(now)}</span>
            <span className="live-clock">
              <span className="live-dot" /> توقيت القاهرة <strong>{formatTime(now)}</strong>
            </span>
            <WeatherBadge />
          </div>

          <div className="strip-group">
            {user ? (
              <div className="account-menu" ref={accountRef}>
                <button
                  className="strip-user"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((open) => !open)}
                >
                  <Icon name="user" size={16} />
                  {profile?.full_name || 'حسابي'}
                  <Icon name="chevron" size={12} />
                </button>
                {accountOpen && (
                  <div className="account-dropdown" role="menu">
                    <button role="menuitem" onClick={() => go('dashboard')}>
                      لوحتي
                    </button>
                    <button role="menuitem" onClick={() => go('verification')}>
                      توثيق الفئة
                    </button>
                    {isAdmin && (
                      <button role="menuitem" onClick={() => go('admin')}>
                        لوحة الأدمن
                      </button>
                    )}
                    <button
                      role="menuitem"
                      className="danger"
                      onClick={() => {
                        setAccountOpen(false);
                        onSignOut();
                      }}
                    >
                      خروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="strip-link" onClick={onLogin}>
                  تسجيل الدخول
                </button>
                <button className="strip-user filled" onClick={onRegister}>
                  حساب جديد
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="header-main">
        <div className="header-inner main-inner">
          <button className="site-brand" onClick={() => go('home')} aria-label={brand.name}>
            <span className="site-brand-mark">
              <Icon name="monorail" size={22} strokeWidth={2.1} />
            </span>
            <span className="site-brand-text">
              {brand.wordmark[0]}
              <strong>{brand.wordmark[1]}</strong>
              <i>.</i>
              <small>{brand.tagline}</small>
            </span>
          </button>

          <nav id="main-nav" className={`main-nav ${menuOpen ? 'open' : ''}`} aria-label="القائمة الرئيسية">
            {nav.map((item) => (
              <button
                key={item.id}
                className={`nav-link ${page === item.id ? 'active' : ''}`}
                aria-current={page === item.id ? 'page' : undefined}
                onClick={() => go(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            className="mobile-menu"
            aria-label="القائمة"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={onToggleMenu}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}
