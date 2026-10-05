import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Icon from '../components/Icon';
import { fareZones, halfTicketEligibility, operatingHours, subscriptions, type PlanId } from '../data/fares';
import { num } from '../lib/format';
import { configured } from '../lib/supabase';
import { buySubscription } from '../lib/ticketing';

type Props = { onPlan: () => void };

type Choice = { plan: PlanId; zone: number };

export default function FaresPage({ onPlan }: Props) {
  const { user } = useAuth();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [holder, setHolder] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const chosenPlan = choice ? subscriptions.find((s) => s.id === choice.plan) : undefined;
  const chosenPrice = chosenPlan && choice ? chosenPlan.prices[choice.zone] : 0;
  const chosenZone = choice ? fareZones[choice.zone].label.split(' (')[0] : '';

  const pay = async () => {
    if (!choice) return;
    const name = holder.trim();
    if (!name) {
      setError('اكتب اسم صاحب الاشتراك');
      return;
    }
    setBusy(true);
    setError('');
    const result = await buySubscription(choice.plan, choice.zone, name);
    if (result.ok) {
      window.location.href = result.url;
      return;
    }
    setError(result.message);
    setBusy(false);
  };

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
                <tr key={sub.id}>
                  <td>{sub.name}</td>
                  <td>{num(sub.trips)} رحلة</td>
                  <td>{num(sub.validityDays)} يوم</td>
                  {sub.prices.map((price, i) => (
                    <td key={i}>
                      {configured ? (
                        <button
                          type="button"
                          className={`price-buy ${choice?.plan === sub.id && choice.zone === i ? 'selected' : ''}`}
                          onClick={() => {
                            setChoice({ plan: sub.id, zone: i });
                            setError('');
                          }}
                        >
                          {num(price)} جنيه
                        </button>
                      ) : (
                        <>{num(price)} جنيه</>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {configured && !choice && <p className="source-note">اضغط على السعر اللي يناسبك عشان تشترك.</p>}

        {configured && chosenPlan && choice && (
          <div className="sub-checkout" role="region" aria-label="تأكيد الاشتراك">
            <div>
              <span className="eyebrow green">اشتراكك</span>
              <h3>
                {chosenPlan.name} · {chosenZone}
              </h3>
              <p>
                {num(chosenPlan.trips)} رحلة، صالحة {num(chosenPlan.validityDays)} يوم · {num(chosenPrice)} جنيه
              </p>
            </div>

            {user ? (
              <>
                <label className="sub-checkout-field">
                  اسم صاحب الاشتراك
                  <input
                    type="text"
                    value={holder}
                    maxLength={80}
                    onChange={(e) => setHolder(e.target.value)}
                    placeholder="الاسم زي ما هيظهر على الكارت"
                  />
                </label>
                <button className="dark-button" onClick={pay} disabled={busy}>
                  {busy ? 'لحظة…' : `ادفع ${num(chosenPrice)} جنيه`} <Icon name="arrow" size={16} />
                </button>
              </>
            ) : (
              <p className="auth-sub">سجّل دخول الأول عشان تقدر تشترك.</p>
            )}
            {error && <p className="sub-checkout-error">{error}</p>}
          </div>
        )}
      </div>

      <p className="source-note">
        الأسعار حسب إعلان وزارة النقل عند بدء التشغيل، وممكن تتغير. التأكيد النهائي عند الشراء من المحطة.
      </p>
      <p className="source-note">
        ملاحظة عن الاشتراكات: المنطقة بتتحدد وقت الشراء بس، ومش بتتفحص عند الدخول لأن مفيش بوابات خروج.
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
