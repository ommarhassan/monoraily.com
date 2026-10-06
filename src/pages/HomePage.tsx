import { brand } from '../config/brand';
import Icon from '../components/Icon';
import MonorailScene from '../components/MonorailScene';
import RouteResult from '../components/RouteResult';
import StationPicker from '../components/StationPicker';
import { lineMeta } from '../data/network';
import type { Planner } from '../hooks/usePlanner';
import { useLanguage } from '../i18n/LanguageContext';
import { formatDate, formatTime, num } from '../lib/format';
import type { Page } from '../navigation';

type Props = { planner: Planner; now: Date; onGo: (page: Page) => void; onBook: () => void };

export default function HomePage({ planner, now, onGo, onBook }: Props) {
  const { t } = useLanguage();
  const { from, to, route, error } = planner;
  const line = lineMeta['east-nile'];
  const count = num(line.stationCount);

  return (
    <div className="dashboard">
      <div className="welcome">
        <div>
          <span className="eyebrow green">{t('home.eyebrow')}</span>
          <h1>
            {t('home.welcome')} <span>{brand.name}.</span>
          </h1>
          <p>{t('home.welcomeSub')}</p>
        </div>
        <div className="date-chip">
          <Icon name="clock" size={18} />
          {formatDate(now)}
        </div>
      </div>

      <section className="hero">
        <div className="hero-scene">
          <MonorailScene />
        </div>
        <div className="hero-pattern" />
        <div className="hero-copy">
          <span className="hero-kicker">
            <span className="hero-kicker-dot" /> {t('home.heroKicker')}
          </span>
          <h2>
            {t('home.heroLine1')}
            <br />
            {t('home.heroLine2')} <em>{t('home.heroEm')}</em>
          </h2>
          <p>{t('home.heroText', { n: count })}</p>
          <button
            onClick={() => document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            {t('home.heroCta')} <Icon name="arrow" size={18} />
          </button>
        </div>
      </section>

      <div className="section-title-row">
        <div>
          <span className="eyebrow green">{t('home.goEyebrow')}</span>
          <h2>
            {t('home.goTitle')}{' '}
            <span className="heading-spark">
              <Icon name="spark" size={18} />
            </span>
          </h2>
        </div>
        <span className="section-helper">{t('home.goHelper')}</span>
      </div>

      <div className="planner-grid">
        <section className="planner-card" id="planner">
          <div className="card-top">
            <div className="card-icon">
              <Icon name="route" size={22} />
            </div>
            <div>
              <h3>{t('home.plannerTitle')}</h3>
              <p>{t('home.plannerSub')}</p>
            </div>
            <span className="card-step">{t('home.plannerStep')}</span>
          </div>

          <div className="picker-stack">
            <StationPicker label={t('home.fromLabel')} value={from} onChange={planner.setFrom} accent="#6aa5d8" />
            <button className="swap-button" onClick={planner.swap} aria-label={t('home.swapAria')}>
              <Icon name="swap" size={18} />
            </button>
            <StationPicker label={t('home.toLabel')} value={to} onChange={planner.setTo} accent="#dd8b67" />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="dark-button plan-button" onClick={planner.submit}>
            {t('home.planButton')} <Icon name="arrow" size={19} />
          </button>
          <div className="planner-foot">
            <Icon name="spark" size={16} /> {t('home.plannerFoot', { n: count })}
          </div>
        </section>

        {route ? (
          <RouteResult route={route} onTicket={onBook} />
        ) : (
          <div className="result-card empty-result">
            <div className="empty-illustration">
              <Icon name="route" size={48} />
            </div>
            <span className="eyebrow green">{t('home.emptyEyebrow')}</span>
            <h3>{t('home.emptyTitle')}</h3>
            <p>{t('home.emptyText')}</p>
          </div>
        )}
      </div>

      <div className="quick-section">
        <div className="section-title-row">
          <div>
            <span className="eyebrow green">{t('home.quickEyebrow')}</span>
            <h2>{t('home.quickTitle')}</h2>
          </div>
        </div>
        <div className="quick-grid">
          <button className="quick-card" onClick={() => onGo('stations')}>
            <span className="quick-icon peach">
              <Icon name="route" size={24} />
            </span>
            <span>
              <strong>{t('home.quickStationsTitle')}</strong>
              <small>{t('home.quickStationsText')}</small>
            </span>
            <Icon name="arrow" size={18} />
          </button>
          <button className="quick-card" onClick={() => onGo('fares')}>
            <span className="quick-icon mint">
              <Icon name="ticket" size={24} />
            </span>
            <span>
              <strong>{t('home.quickFaresTitle')}</strong>
              <small>{t('home.quickFaresText')}</small>
            </span>
            <Icon name="arrow" size={18} />
          </button>
          <div className="quick-card static">
            <span className="quick-icon lavender">
              <Icon name="clock" size={24} />
            </span>
            <span>
              <strong>{t('home.quickHoursTitle')}</strong>
              <small>{t('fares.operatingHours')}</small>
            </span>
            <span className="quick-clock">{formatTime(now)}</span>
          </div>
        </div>
      </div>

      <footer className="main-footer">
        <span>{brand.name} — {t('home.footer1')}</span>
        <span>{t('home.footer2')}</span>
      </footer>
    </div>
  );
}
