import { brand } from '../config/brand';
import Icon from '../components/Icon';
import MonorailScene from '../components/MonorailScene';
import RouteResult from '../components/RouteResult';
import StationPicker from '../components/StationPicker';
import { operatingHours } from '../data/fares';
import { lineMeta } from '../data/network';
import type { Planner } from '../hooks/usePlanner';
import { formatDate, formatTime, num } from '../lib/format';
import type { Page } from '../navigation';

type Props = { planner: Planner; now: Date; onGo: (page: Page) => void; onBook: () => void };

export default function HomePage({ planner, now, onGo, onBook }: Props) {
  const { from, to, route, error } = planner;
  const line = lineMeta['east-nile'];

  return (
    <div className="dashboard">
      <div className="welcome">
        <div>
          <span className="eyebrow green">صباحًا أو مساءً، المونوريل مستنيك</span>
          <h1>
            أهلًا بيك في <span>{brand.name}.</span>
          </h1>
          <p>مشوارك الجاي أسهل من أي وقت فات. من أول محطة لآخر محطة، إحنا معاك.</p>
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
            <span className="hero-kicker-dot" /> اكتشف القاهرة من فوق
          </span>
          <h2>
            المشوار فوق الزحمة
            <br />
            بيبدأ <em>بخطة.</em>
          </h2>
          <p>{num(line.stationCount)} محطة من مدينة نصر لحد العاصمة الإدارية. اختار وجهتك، وسيب الباقي علينا.</p>
          <button
            onClick={() => document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            خطط رحلتك دلوقتي <Icon name="arrow" size={18} />
          </button>
        </div>
      </section>

      <div className="section-title-row">
        <div>
          <span className="eyebrow green">يلا نتحرك</span>
          <h2>
            رحلتك تبدأ من هنا{' '}
            <span className="heading-spark">
              <Icon name="spark" size={18} />
            </span>
          </h2>
        </div>
        <span className="section-helper">خطوات بسيطة، ووصول أسرع.</span>
      </div>

      <div className="planner-grid">
        <section className="planner-card" id="planner">
          <div className="card-top">
            <div className="card-icon">
              <Icon name="route" size={22} />
            </div>
            <div>
              <h3>خطط مشوارك</h3>
              <p>قولنا رايح فين وهنظبطلك الطريق</p>
            </div>
            <span className="card-step">01 / خطط الرحلة</span>
          </div>

          <div className="picker-stack">
            <StationPicker label="محطة البداية" value={from} onChange={planner.setFrom} accent="#6aa5d8" />
            <button className="swap-button" onClick={planner.swap} aria-label="تبديل محطتي البداية والوصول">
              <Icon name="swap" size={18} />
            </button>
            <StationPicker label="محطة الوصول" value={to} onChange={planner.setTo} accent="#dd8b67" />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="dark-button plan-button" onClick={planner.submit}>
            اعرض أفضل مسار <Icon name="arrow" size={19} />
          </button>
          <div className="planner-foot">
            <Icon name="spark" size={16} /> مسار محسوب على خط شرق النيل ({num(line.stationCount)} محطة)
          </div>
        </section>

        {route ? (
          <RouteResult route={route} onTicket={onBook} />
        ) : (
          <div className="result-card empty-result">
            <div className="empty-illustration">
              <Icon name="route" size={48} />
            </div>
            <span className="eyebrow green">مستنيينك</span>
            <h3>اختار محطتين، وشوف الطريق.</h3>
            <p>هنحسبلك المسار والمحطات والتكلفة التقديرية في ثواني.</p>
          </div>
        )}
      </div>

      <div className="quick-section">
        <div className="section-title-row">
          <div>
            <span className="eyebrow green">مفيد ليك</span>
            <h2>كل اللي تحتاجه في مكان واحد.</h2>
          </div>
        </div>
        <div className="quick-grid">
          <button className="quick-card" onClick={() => onGo('stations')}>
            <span className="quick-icon peach">
              <Icon name="route" size={24} />
            </span>
            <span>
              <strong>استكشف المحطات</strong>
              <small>شوف كل المحطات وأماكن التبديل</small>
            </span>
            <Icon name="arrow" size={18} />
          </button>
          <button className="quick-card" onClick={() => onGo('fares')}>
            <span className="quick-icon mint">
              <Icon name="ticket" size={24} />
            </span>
            <span>
              <strong>أسعار التذاكر</strong>
              <small>التذكرة والاشتراكات ونصف التذكرة</small>
            </span>
            <Icon name="arrow" size={18} />
          </button>
          <div className="quick-card static">
            <span className="quick-icon lavender">
              <Icon name="clock" size={24} />
            </span>
            <span>
              <strong>ساعات التشغيل</strong>
              <small>{operatingHours}</small>
            </span>
            <span className="quick-clock">{formatTime(now)}</span>
          </div>
        </div>
      </div>

      <footer className="main-footer">
        <span>{brand.name} — نموذج أولي لتجربة التنقل بالمونوريل</span>
        <span>المواعيد تقديرية · التذاكر تجريبية وليست صالحة للسفر</span>
      </footer>
    </div>
  );
}
