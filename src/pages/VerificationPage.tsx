import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { TextKey } from '../i18n/dictionary';
import { useLanguage } from '../i18n/LanguageContext';
import {
  categoryLabels,
  myVerification,
  submitVerification,
  type MyVerification,
  type VerificationCategory,
} from '../lib/verification';

const categoryText: Record<VerificationCategory, TextKey> = {
  senior: 'catSenior',
  disabled: 'catDisabled',
};

export default function VerificationPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [info, setInfo] = useState<MyVerification | null>(null);
  const [category, setCategory] = useState<VerificationCategory>('senior');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => setInfo(await myVerification());

  useEffect(() => {
    void load();
  }, [user?.id]);

  const submit = async () => {
    if (!file) {
      setMessage({ ok: false, text: t('chooseIdFirst') });
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await submitVerification(file, category);
    setBusy(false);
    if (result.ok) {
      setFile(null);
      setMessage({ ok: true, text: t('requestSent') });
      await load();
    } else {
      setMessage({ ok: false, text: result.errorKey ? t(result.errorKey) : t('genericError') });
    }
  };

  const expired = info && !info.category && info.latest?.status === 'approved';
  const pending = info?.latest?.status === 'pending';
  const rejected = info?.latest?.status === 'rejected';

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">{t('accountEyebrow')}</span>
        <h1>{t('verification')}</h1>
        <p>{t('verifIntro')}</p>
      </div>

      {!info ? (
        <p className="auth-sub">{t('loading')}</p>
      ) : info.category ? (
        <div className="network-card">
          <h3>{t('verifiedTitle')}</h3>
          <p>{t('categoryLine', { category: t(categoryText[info.category]) })}</p>
          <p>{t('validUntil', { date: info.until ?? '' })}</p>
        </div>
      ) : pending ? (
        <div className="network-card">
          <h3>{t('statusPending')}</h3>
          <p>{t('pendingBody')}</p>
        </div>
      ) : (
        <div className="network-card">
          {expired && <p>{t('expiredNotice')}</p>}
          {rejected && <p>{t('rejectedNotice')}</p>}

          <h3>{t('submitTitle')}</h3>

          <label className="auth-sub" htmlFor="verify-category">
            {t('categoryField')}
          </label>
          <select
            id="verify-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as VerificationCategory)}
          >
            {(Object.keys(categoryLabels) as VerificationCategory[]).map((key) => (
              <option key={key} value={key}>
                {t(categoryText[key])}
              </option>
            ))}
          </select>

          <label className="auth-sub" htmlFor="verify-file">
            {t('fileField')}
          </label>
          <input
            id="verify-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <p className="auth-sub">{t('privacyNote')}</p>

          <button className="dark-button" disabled={busy || !file} onClick={submit}>
            {busy ? t('uploading') : t('sendRequest')}
          </button>
        </div>
      )}

      {message && (
        <p className={message.ok ? 'auth-sub' : 'gate-error'} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}
