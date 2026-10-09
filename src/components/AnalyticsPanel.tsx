import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { num } from '../lib/format';
import { supabase } from '../lib/supabase';
import '../styles/analytics.css';
import { getStationName } from './StationPicker';

// ---------- Types (what the SQL functions return) ----------

type Period = {
  ticket_revenue: number;
  subscription_revenue: number;
  revenue: number;
  tickets: number;
  passengers: number;
  avg_fare: number;
  half_tickets: number;
  advance_tickets: number;
  subscriptions: number;
  orders_created: number;
  orders_paid: number;
  orders_failed: number;
  new_users: number;
};

type Sales = { days: number; source: string; generated_at: string; current: Period; previous: Period };

type Daily = {
  day: string;
  ticket_revenue: number;
  subscription_revenue: number;
  tickets: number;
  passengers: number;
  subscriptions: number;
};

type Breakdowns = {
  days: number;
  daily: Daily[];
  by_hour: { hour: number; tickets: number; passengers: number }[];
  by_weekday: { dow: number; tickets: number; passengers: number }[];
  top_origins: { station: string; passengers: number }[];
  top_destinations: { station: string; passengers: number }[];
  top_routes: { from: string; to: string; tickets: number; passengers: number }[];
  plans: { plan: string; count: number; revenue: number }[];
  scans: { result: string; count: number }[];
};

type Source = 'all' | 'real' | 'demo';

const REFRESH_MS = 30_000;
const PERIODS = [7, 14, 30];

const PLAN_NAMES: Record<string, { ar: string; en: string }> = {
  weekly: { ar: 'أسبوعي', en: 'Weekly' },
  monthly: { ar: 'شهري', en: 'Monthly' },
  quarterly: { ar: 'ربع سنوي', en: 'Quarterly' },
};

const SCAN_NAMES: Record<string, { ar: string; en: string }> = {
  ok: { ar: 'مقبول', en: 'Accepted' },
  used: { ar: 'مستخدمة / رصيد خلص', en: 'Already used' },
  expired: { ar: 'منتهية', en: 'Expired' },
  invalid: { ar: 'رمز غير صحيح', en: 'Invalid code' },
  not_yet: { ar: 'لسه ما بدأتش', en: 'Not valid yet' },
};

// Egypt's week starts on Saturday. Postgres dow: 0 = Sunday.
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];
const WEEKDAYS: { ar: string; en: string }[] = [
  { ar: 'الأحد', en: 'Sun' },
  { ar: 'الاثنين', en: 'Mon' },
  { ar: 'الثلاثاء', en: 'Tue' },
  { ar: 'الأربعاء', en: 'Wed' },
  { ar: 'الخميس', en: 'Thu' },
  { ar: 'الجمعة', en: 'Fri' },
  { ar: 'السبت', en: 'Sat' },
];

// ---------- Small helpers ----------

const niceCeil = (max: number) => {
  const pow = 10 ** Math.floor(Math.log10(Math.max(max, 1)));
  const n = max / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
};

const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

type DeltaProps = { cur: number; prev: number; mode: 'rel' | 'pp'; isAr: boolean; locale: string };

/** Up / down arrow against the previous period. */
function Delta({ cur, prev, mode, isAr, locale }: DeltaProps) {
  let direction: 'up' | 'down' | 'flat' = 'flat';
  let text = '—';

  if (mode === 'rel') {
    if (prev === 0 && cur > 0) {
      direction = 'up';
      text = isAr ? 'جديد' : 'New';
    } else if (prev > 0) {
      const change = ((cur - prev) / prev) * 100;
      if (Math.abs(change) >= 0.05) {
        direction = change > 0 ? 'up' : 'down';
        text = `${num(Number(Math.abs(change).toFixed(1)), locale)}%`;
      }
    }
  } else {
    const diff = cur - prev;
    if (Math.abs(diff) >= 0.05) {
      direction = diff > 0 ? 'up' : 'down';
      text = `${num(Number(Math.abs(diff).toFixed(1)), locale)} ${isAr ? 'نقطة' : 'pt'}`;
    }
  }

  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '–';
  return (
    <span className={`an-delta ${direction}`}>
      {arrow} {text}
    </span>
  );
}

type BarItem = { label: string; value: number; title: string; highlight?: boolean };

/** Simple vertical bar chart drawn with SVG (no chart library needed). */
function Bars({ items, locale, labelEvery = 1 }: { items: BarItem[]; locale: string; labelEvery?: number }) {
  const W = 640;
  const H = 220;
  const padL = 40;
  const padR = 8;
  const padT = 10;
  const padB = 28;
  const max = niceCeil(Math.max(1, ...items.map((i) => i.value)));
  const bw = (W - padL - padR) / items.length;
  const innerH = H - padT - padB;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg className="an-svg" viewBox={`0 0 ${W} ${H}`} role="img">
      {ticks.map((t) => {
        const y = padT + innerH - t * innerH;
        return (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} className="an-grid" />
            <text x={padL - 6} y={y + 4} textAnchor="end" className="an-axis">
              {num(Math.round(max * t), locale)}
            </text>
          </g>
        );
      })}
      {items.map((item, i) => {
        const h = (item.value / max) * innerH;
        const x = padL + i * bw + bw * 0.14;
        return (
          <g key={i}>
            <rect
              x={x}
              y={padT + innerH - h}
              width={bw * 0.72}
              height={Math.max(h, item.value > 0 ? 1 : 0)}
              rx={3}
              className={item.highlight ? 'an-bar peak' : 'an-bar'}
            >
              <title>{item.title}</title>
            </rect>
            {i % labelEvery === 0 && (
              <text x={x + bw * 0.36} y={H - 8} textAnchor="middle" className="an-axis">
                {item.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

type RankItem = { label: string; value: number; sub?: string };

function RankList({ items, locale, empty }: { items: RankItem[]; locale: string; empty: string }) {
  if (items.length === 0 || items.every((i) => i.value === 0)) return <p className="an-empty">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="an-rank">
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`}>
          <div className="an-rank-top">
            <span className="an-rank-label">{item.label}</span>
            <strong>{num(item.value, locale)}</strong>
          </div>
          <div className="an-rank-track">
            <span style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          {item.sub && <small>{item.sub}</small>}
        </li>
      ))}
    </ul>
  );
}

// ---------- The panel ----------

export default function AnalyticsPanel() {
  const { lang, locale } = useLanguage();
  const isAr = lang === 'ar';
  const tx = (ar: string, en: string) => (isAr ? ar : en);

  const [days, setDays] = useState(7);
  const [source, setSource] = useState<Source>('all');
  const [sales, setSales] = useState<Sales | null>(null);
  const [parts, setParts] = useState<Breakdowns | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setFailed(true);
      setLoading(false);
      return;
    }
    const [a, b] = await Promise.all([
      supabase.rpc('analytics_sales', { p_days: days, p_source: source }),
      supabase.rpc('analytics_breakdowns', { p_days: days, p_source: source }),
    ]);
    if (a.error || b.error) {
      console.error('analytics failed', a.error?.message, b.error?.message);
      setFailed(true);
      setLoading(false);
      return;
    }
    setSales(a.data as Sales);
    setParts(b.data as Breakdowns);
    setFailed(false);
    setUpdatedAt(new Date());
    setLoading(false);
  }, [days, source]);

  // Load, then refresh by itself so the numbers follow new bookings.
  useEffect(() => {
    setLoading(true);
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  const egp = tx('جنيه', 'EGP');
  const money = (n: number) => `${num(n, locale)} ${egp}`;
  const station = (name: string) => getStationName(name, lang);
  const dayLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
      new Date(`${iso}T00:00:00Z`),
    );

  const header = (
    <div className="an-head">
      <div>
        <span className="eyebrow green">{tx('التحليلات', 'Analytics')}</span>
        <h2>{tx('أداء الموقع لحظة بلحظة', 'Live site performance')}</h2>
      </div>
      <div className="an-controls">
        <div className="an-seg" role="group" aria-label={tx('الفترة', 'Period')}>
          {PERIODS.map((d) => (
            <button key={d} className={days === d ? 'active' : ''} onClick={() => setDays(d)}>
              {isAr ? `${num(d, locale)} يوم` : `${d}d`}
            </button>
          ))}
        </div>
        <div className="an-seg" role="group" aria-label={tx('نوع البيانات', 'Data type')}>
          {(['all', 'real', 'demo'] as Source[]).map((s) => (
            <button key={s} className={source === s ? 'active' : ''} onClick={() => setSource(s)}>
              {s === 'all' ? tx('الكل', 'All') : s === 'real' ? tx('حقيقية', 'Real') : tx('تجريبية', 'Demo')}
            </button>
          ))}
        </div>
        <button className="an-refresh" onClick={() => void load()} aria-label={tx('تحديث', 'Refresh')}>
          ⟳
        </button>
      </div>
    </div>
  );

  if (loading && !sales) {
    return (
      <section className="an-wrap">
        {header}
        <p className="an-empty">{tx('بنحمّل التحليلات…', 'Loading analytics…')}</p>
      </section>
    );
  }

  if (failed || !sales || !parts) {
    return (
      <section className="an-wrap">
        {header}
        <p className="an-empty" role="alert">
          {tx(
            'مقدرناش نجيب التحليلات. اتأكد إنك مسجّل بحساب أدمن، وإن دوال التحليل متنشرة على Supabase.',
            'Could not load analytics. Make sure you are signed in as an admin and the analytics functions exist in Supabase.',
          )}
        </p>
      </section>
    );
  }

  const cur = sales.current;
  const prev = sales.previous;

  const kpis: { label: string; value: string; cur: number; prev: number; mode: 'rel' | 'pp'; hint?: string }[] = [
    { label: tx('إجمالي الإيرادات', 'Total revenue'), value: money(cur.revenue), cur: cur.revenue, prev: prev.revenue, mode: 'rel' },
    { label: tx('إيراد التذاكر', 'Ticket revenue'), value: money(cur.ticket_revenue), cur: cur.ticket_revenue, prev: prev.ticket_revenue, mode: 'rel' },
    { label: tx('إيراد الاشتراكات', 'Subscription revenue'), value: money(cur.subscription_revenue), cur: cur.subscription_revenue, prev: prev.subscription_revenue, mode: 'rel' },
    { label: tx('التذاكر المباعة', 'Tickets sold'), value: num(cur.tickets, locale), cur: cur.tickets, prev: prev.tickets, mode: 'rel' },
    { label: tx('الركاب', 'Passengers'), value: num(cur.passengers, locale), cur: cur.passengers, prev: prev.passengers, mode: 'rel' },
    { label: tx('متوسط سعر التذكرة', 'Average ticket'), value: money(cur.avg_fare), cur: cur.avg_fare, prev: prev.avg_fare, mode: 'rel' },
    { label: tx('اشتراكات جديدة', 'New subscriptions'), value: num(cur.subscriptions, locale), cur: cur.subscriptions, prev: prev.subscriptions, mode: 'rel' },
    { label: tx('مستخدمون جدد', 'New users'), value: num(cur.new_users, locale), cur: cur.new_users, prev: prev.new_users, mode: 'rel' },
    {
      label: tx('نسبة إتمام الدفع', 'Payment completion'),
      value: `${num(Number(pct(cur.orders_paid, cur.orders_created).toFixed(1)), locale)}%`,
      cur: pct(cur.orders_paid, cur.orders_created),
      prev: pct(prev.orders_paid, prev.orders_created),
      mode: 'pp',
    },
    {
      label: tx('نسبة الحجز المسبق', 'Advance bookings'),
      value: `${num(Number(pct(cur.advance_tickets, cur.tickets).toFixed(1)), locale)}%`,
      cur: pct(cur.advance_tickets, cur.tickets),
      prev: pct(prev.advance_tickets, prev.tickets),
      mode: 'pp',
    },
    {
      label: tx('نسبة نصف التذكرة', 'Half-fare share'),
      value: `${num(Number(pct(cur.half_tickets, cur.tickets).toFixed(1)), locale)}%`,
      cur: pct(cur.half_tickets, cur.tickets),
      prev: pct(prev.half_tickets, prev.tickets),
      mode: 'pp',
    },
  ];

  // Charts data
  const dailyItems: BarItem[] = parts.daily.map((d) => {
    const total = d.ticket_revenue + d.subscription_revenue;
    return {
      label: dayLabel(d.day),
      value: total,
      title: `${dayLabel(d.day)}: ${money(total)} (${tx('تذاكر', 'tickets')} ${num(d.tickets, locale)}, ${tx('اشتراكات', 'subs')} ${num(d.subscriptions, locale)})`,
    };
  });
  const dailyStep = Math.max(1, Math.ceil(dailyItems.length / 8));

  const peakHour = parts.by_hour.reduce((best, h) => (h.tickets > best.tickets ? h : best), parts.by_hour[0]);
  const hourItems: BarItem[] = parts.by_hour.map((h) => ({
    label: num(h.hour, locale),
    value: h.tickets,
    title: `${num(h.hour, locale)}:00 — ${num(h.tickets, locale)} ${tx('تذكرة', 'tickets')}`,
    highlight: peakHour.tickets > 0 && h.hour === peakHour.hour,
  }));

  const weekItems: BarItem[] = WEEK_ORDER.map((dow) => {
    const row = parts.by_weekday.find((w) => w.dow === dow);
    const name = WEEKDAYS[dow][lang];
    return { label: name, value: row?.tickets ?? 0, title: `${name} — ${num(row?.tickets ?? 0, locale)} ${tx('تذكرة', 'tickets')}` };
  });
  const maxWeek = Math.max(...weekItems.map((w) => w.value));
  weekItems.forEach((w) => (w.highlight = maxWeek > 0 && w.value === maxWeek));

  const pending = Math.max(0, cur.orders_created - cur.orders_paid - cur.orders_failed);
  const noData = tx('مفيش بيانات في الفترة دي.', 'No data in this period.');

  return (
    <section className="an-wrap">
      {header}

      <div className="an-live">
        <span className="an-dot" aria-hidden="true" />
        <span>
          {tx('بيتحدّث تلقائيًا كل ٣٠ ثانية', 'Refreshes automatically every 30 seconds')}
          {updatedAt && ` · ${tx('آخر تحديث', 'Last update')} ${updatedAt.toLocaleTimeString(locale, { timeZone: 'Africa/Cairo' })}`}
          {' · '}
          {tx('المقارنة مع الفترة اللي قبلها بنفس الطول', 'Compared with the previous period of the same length')}
        </span>
      </div>

      <div className="an-kpis">
        {kpis.map((k) => (
          <div className="an-kpi" key={k.label}>
            <small>{k.label}</small>
            <strong>{k.value}</strong>
            <Delta cur={k.cur} prev={k.prev} mode={k.mode} isAr={isAr} locale={locale} />
          </div>
        ))}
      </div>

      <div className="an-grid-2">
        <div className="an-card">
          <h3>{tx('الإيرادات يوم بيوم', 'Revenue by day')}</h3>
          <div className="an-chart">
            <Bars items={dailyItems} locale={locale} labelEvery={dailyStep} />
          </div>
        </div>

        <div className="an-card">
          <h3>{tx('قمع الدفع', 'Payment funnel')}</h3>
          {cur.orders_created === 0 ? (
            <p className="an-empty">{noData}</p>
          ) : (
            <>
              <div className="an-funnel" aria-hidden="true">
                <span className="paid" style={{ flexGrow: cur.orders_paid }} />
                <span className="pending" style={{ flexGrow: pending }} />
                <span className="failed" style={{ flexGrow: cur.orders_failed }} />
              </div>
              <ul className="an-legend">
                <li><i className="paid" />{tx('مدفوع', 'Paid')}<strong>{num(cur.orders_paid, locale)}</strong></li>
                <li><i className="pending" />{tx('معلّق / متكمّلش', 'Pending / abandoned')}<strong>{num(pending, locale)}</strong></li>
                <li><i className="failed" />{tx('فاشل', 'Failed')}<strong>{num(cur.orders_failed, locale)}</strong></li>
                <li className="total">{tx('إجمالي الطلبات', 'Total orders')}<strong>{num(cur.orders_created, locale)}</strong></li>
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="an-grid-2">
        <div className="an-card">
          <h3>{tx('ساعات الذروة (توقيت القاهرة)', 'Peak hours (Cairo time)')}</h3>
          {peakHour.tickets > 0 && (
            <p className="an-note">
              {tx('أعلى ساعة:', 'Busiest hour:')} <strong>{num(peakHour.hour, locale)}:00</strong>
            </p>
          )}
          <div className="an-chart">
            <Bars items={hourItems} locale={locale} labelEvery={3} />
          </div>
        </div>

        <div className="an-card">
          <h3>{tx('حسب أيام الأسبوع', 'By day of week')}</h3>
          <div className="an-chart">
            <Bars items={weekItems} locale={locale} />
          </div>
        </div>
      </div>

      <div className="an-grid-3">
        <div className="an-card">
          <h3>{tx('أكتر محطات ركوب', 'Top boarding stations')}</h3>
          <RankList
            empty={noData}
            locale={locale}
            items={parts.top_origins.map((s) => ({ label: station(s.station), value: s.passengers }))}
          />
        </div>
        <div className="an-card">
          <h3>{tx('أكتر محطات وصول', 'Top destination stations')}</h3>
          <RankList
            empty={noData}
            locale={locale}
            items={parts.top_destinations.map((s) => ({ label: station(s.station), value: s.passengers }))}
          />
        </div>
        <div className="an-card">
          <h3>{tx('أكتر الخطوط طلبًا', 'Top routes')}</h3>
          <RankList
            empty={noData}
            locale={locale}
            items={parts.top_routes.map((r) => ({
              label: `${station(r.from)} ${isAr ? '←' : '→'} ${station(r.to)}`,
              value: r.passengers,
              sub: `${num(r.tickets, locale)} ${tx('تذكرة', 'tickets')}`,
            }))}
          />
        </div>
      </div>

      <div className="an-grid-2">
        <div className="an-card">
          <h3>{tx('الاشتراكات حسب الباقة', 'Subscriptions by plan')}</h3>
          <RankList
            empty={noData}
            locale={locale}
            items={parts.plans.map((p) => ({
              label: PLAN_NAMES[p.plan]?.[lang] ?? p.plan,
              value: p.count,
              sub: money(p.revenue),
            }))}
          />
        </div>
        <div className="an-card">
          <h3>{tx('نتيجة المسح عند البوابة', 'Gate scan results')}</h3>
          <RankList
            empty={noData}
            locale={locale}
            items={parts.scans.map((s) => ({ label: SCAN_NAMES[s.result]?.[lang] ?? s.result, value: s.count }))}
          />
        </div>
      </div>
    </section>
  );
}
