import Icon from '../components/Icon';
import { fareZones, halfTicketEligibility, operatingHours, subscriptions } from '../data/fares';
import { num } from '../lib/format';

type Props = { onPlan: () => void };

export default function FaresPage({ onPlan }: Props) {
  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">أسعار التذاكر</span>
        <h1>اعرف تكلفتها قبل ما تتحرك.</h1>
        <p>التسعير بالمناطق: كل منطقة ٥ محطات تقريبًا، وكل ما بتعدّي مناطق أكتر السعر بيزيد.</p>
      </div>

      <div className="fare-grid">
        {fareZones.map((zone, i) => (
          <div className={`fare-card ${i === 1 ? 'featured' : ''}`} key={zone.label}>
            <div className="fare-card-top">
              <span>0{i + 1}</span>
              <Icon name="ticket" size={22} />
            </div>
            <span className="fare-hint">{zone.hint}</span>
            <h2>{zone.label}</h2>
            <div className="fare-value">
              {num(zone.full)} <small>جنيه مصري</small>
            </div>
            <div className="fare-card-bottom">
              <Icon name="check" size={16} /> نصف التذكرة: {num(zone.half)} جنيه
            </div>
          </div>
        ))}
      </div>

      <div className="fare-info">
        <div className="fare-info-icon">
          <Icon name="info" size={24} />
        </div>
        <div>
          <h3>نصف التذكرة</h3>
          <p>
            نصف التذكرة متاح لـ {halfTicketEligibility}. ساعات التشغيل المعلنة: {operatingHours}.
          </p>
        </div>
      </div>

      <div className="network-card fares-subscriptions">
        <div className="network-header">
          <div>
            <span className="eyebrow green">اشتراكات</span>
            <h2>وفّر ٥٠٪ مع الاشتراك</h2>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>الاشتراك</th>
                <th>الرحلات</th>
                <th>الصلاحية</th>
                {fareZones.map((zone) => (
                  <th key={zone.label}>{zone.label.split(' (')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.name}>
                  <td>{sub.name}</td>
                  <td>{num(sub.trips)} رحلة</td>
                  <td>{num(sub.validityDays)} يوم</td>
                  {sub.prices.map((price, i) => (
                    <td key={i}>{num(price)} جنيه</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="source-note">
        الأسعار حسب إعلان وزارة النقل عند بدء التشغيل، وممكن تتغير. التأكيد النهائي عند الشراء من المحطة.
      </p>

      <div className="ticket-cta">
        <div>
          <span className="eyebrow">مستعد للانطلاق؟</span>
          <h2>خطط رحلتك واعرف سعرها فورًا.</h2>
        </div>
        <button className="light-button" onClick={onPlan}>
          خطط رحلتي <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
