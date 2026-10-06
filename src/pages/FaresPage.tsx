import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Icon from '../components/Icon';
import { fareZones, subscriptions, type PlanId } from '../data/fares';
import { useLanguage } from '../i18n/LanguageContext';
import { num } from '../lib/format';
import { configured } from '../lib/supabase';
import { buySubscription } from '../lib/ticketing';

type Props = { onPlan: () => void };

type Choice = { plan: PlanId; zone: number };

export default function FaresPage({ onPlan }: Props) {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [holder, setHolder] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const chosenPlan = choice ? subscriptions.find((s) => s.id === choice.plan) : undefined;
  const chosenPrice = chosenPlan && choice ? chosenPlan.prices[choice.zone] : 0;
  const chosenZone = choice ? t(`zone.${choice.zone}.short`) : '';

  const pay = async () => {
    if (!choice) return;
    const name = holder.trim();
    if (!name) {
      setError(t('fares.holderRequired'));
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
        <span className="eyebrow green">{t('fares.eyebrow')}</span>
        <h1>{t('fares.title')}</h1>
        <p>{t('fares.intro')}</p>
      </div>

      <div className="fare-grid">
        {fareZones.map((zone, i) => (
          <div className={`fare-card ${i === 1 ? 'featured' : ''}`} key={zone.label}>
            <div className="fare-card-top">
              <span>0{i + 1}</span>
              <Icon name="ticket" size={22} />
            </div>
            <span className="fare-hint">{t(`zone.${i}.hint`)}</span>
            <h2>{t(`zone.${i}.label`)}</h2>
            <div className="fare-value">
              {num(zone.full, locale)} <small>{t('fares.currencyLong')}</small>
            </div>
            <div className="fare-card-bottom">
              <Icon name="check" size={16} /> {t('fares.halfValue', { price: num(zone.half, locale) })}
            </div>
          </div>
        ))}
      </div>

      <div className="fare-info">
        <div className="fare-info-icon">
          <Icon name="info" size={24} />
        </div>
        <div>
          <h3>{t('fares.halfTitle')}</h3>
          <p>
            {t('fares.halfInfo', {
              who: t('fares.halfEligibility'),
              hours: t('fares.operatingHours'),
            })}
          </p>
        </div>
      </div>

      <div className="network-card fares-subscriptions">
        <div className="network-header">
          <div>
            <span className="eyebrow green">{t('fares.subsEyebrow')}</span>
            <h2>{t('fares.subsTitle')}</h2>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('fares.colPlan')}</th>
                <th>{t('fares.colTrips')}</th>
                <th>{t('fares.colValidity')}</th>
                {fareZones.map((zone, i) => (
                  <th key={zone.label}>{t(`zone.${i}.short`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td>{t(`plan.${sub.id}`)}</td>
                  <td>{t('fares.tripsCount', { n: num(sub.trips, locale) })}</td>
                  <td>{t('fares.daysCount', { n: num(sub.validityDays, locale) })}</td>
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
                          {t('common.amount', { n: num(price, locale) })}
                        </button>
                      ) : (
                        <>{t('common.amount', { n: num(price, locale) })}</>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {configured && !choice && <p className="source-note">{t('fares.pickPrice')}</p>}

        {configured && chosenPlan && choice && (
          <div className="sub-checkout" role="region" aria-label={t('fares.confirmAria')}>
            <div>
              <span className="eyebrow green">{t('fares.yourSub')}</span>
              <h3>
                {t(`plan.${chosenPlan.id}`)} · {chosenZone}
              </h3>
              <p>
                {t('fares.subSummary', {
                  trips: num(chosenPlan.trips, locale),
                  days: num(chosenPlan.validityDays, locale),
                  price: num(chosenPrice, locale),
                })}
              </p>
            </div>

            {user ? (
              <>
                <label className="sub-checkout-field">
                  {t('fares.holderLabel')}
                  <input
                    type="text"
                    value={holder}
                    maxLength={80}
                    onChange={(e) => setHolder(e.target.value)}
                    placeholder={t('fares.holderPlaceholder')}
                  />
                </label>
                <button className="dark-button" onClick={pay} disabled={busy}>
                  {busy ? t('common.wait') : t('fares.pay', { price: num(chosenPrice, locale) })}{' '}
                  <Icon name="arrow" size={16} />
                </button>
              </>
            ) : (
              <p className="auth-sub">{t('fares.loginFirst')}</p>
            )}
            {error && <p className="sub-checkout-error">{error}</p>}
          </div>
        )}
      </div>

      <p className="source-note">{t('fares.sourceNote1')}</p>
      <p className="source-note">{t('fares.sourceNote2')}</p>

      <div className="ticket-cta">
        <div>
          <span className="eyebrow">{t('fares.ctaEyebrow')}</span>
          <h2>{t('fares.ctaTitle')}</h2>
        </div>
        <button className="light-button" onClick={onPlan}>
          {t('fares.ctaButton')} <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
