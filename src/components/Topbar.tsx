import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../config/brand';
import { navLabelsEn } from '../i18n/dictionary';
import { useLanguage } from '../i18n/LanguageContext';
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

const dateOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Africa/Cairo',
};

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.6 4 5.7 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.7-4-9s1.4-6.4 4-9z" />
    </svg>
  );
}

/** Site header: utility strip (date, clock, weather, account) and the main navigation. */
export default function Topbar({ page, now, menuOpen, onToggleMenu, onGo, onLogin, onRegister, onSignOut }: Props) {
  const { user, profile, isAdmin } = useAuth();
  const { lang, locale, t, toggleLang } = useLanguage();
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

  const navLabel = (id: string, arabic: string) => (lang === 'en' ? (navLabelsEn[id] ?? arabic) : arabic);

  return (
    <header className="site-header">
      <div className="header-strip">
        <div className="header-inner strip-inner">
          <div className="strip-group">
            <span className="strip-date">{new Intl.DateTimeFormat(locale, dateOptions).format(now)}</span>
            <span className="live-clock">
              <span className="live-dot" /> {t('clockLabel')} <strong>{formatTime(now)}</strong>
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
                  {profile?.full_name || t('myAccount')}
                  <Icon name="chevron" size={12} />
                </button>
                {accountOpen && (
                  <div className="account-dropdown" role="menu">
                    <button role="menuitem" onClick={() => go('dashboard')}>
                      {t('dashboard')}
                    </button>
                    <button role="menuitem" onClick={() => go('verification')}>
                      {t('verification')}
                    </button>
                    {isAdmin && (
                      <button role="menuitem" onClick={() => go('admin')}>
                        {t('admin')}
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
                      {t('signOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="strip-link" onClick={onLogin}>
                  {t('login')}
                </button>
                <button className="strip-user filled" onClick={onRegister}>
                  {t('register')}
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
              <small>{lang === 'ar' ? brand.tagline : t('tagline')}</small>
            </span>
          </button>

          <nav id="main-nav" className={`main-nav ${menuOpen ? 'open' : ''}`} aria-label={t('mainMenu')}>
            {nav.map((item) => (
              <button
                key={item.id}
                className={`nav-link ${page === item.id ? 'active' : ''}`}
                aria-current={page === item.id ? 'page' : undefined}
                onClick={() => go(item.id)}
              >
                {navLabel(item.id, item.label)}
              </button>
            ))}
          </nav>

          <button className="lang-toggle" onClick={toggleLang} aria-label={t('switchLangLabel')} title={t('switchLangLabel')}>
            <GlobeIcon />
            <span>{t('switchLangShort')}</span>
          </button>

          <button
            className="mobile-menu"
            aria-label={t('menu')}
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
