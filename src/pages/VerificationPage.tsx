import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  categoryLabels,
  myVerification,
  submitVerification,
  type MyVerification,
  type VerificationCategory,
} from '../lib/verification';

/** English names for the categories. Any category not listed here falls back to the Arabic label. */
const categoryNamesEn: Partial<Record<VerificationCategory, string>> = {
  senior: 'Senior (over 60)',
  disability: 'Person with a disability',
} as Partial<Record<VerificationCategory, string>>;

export default function VerificationPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const L = (ar: string, en: string) => (isAr ? ar : en);

  const [info, setInfo] = useState<MyVerification | null>(null);
  const [category, setCategory] = useState<VerificationCategory>('senior');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => setInfo(await myVerification());

  useEffect(() => {
    void load();
  }, [user?.id]);

  const categoryName = (key: VerificationCategory) =>
    isAr ? categoryLabels[key] : categoryNamesEn[key] ?? categoryLabels[key];

  const submit = async () => {
    if (!file) {
      setMessage({ ok: false, text: L('اختار صورة الهوية الأول.', 'Choose your ID image first.') });
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await submitVerification(file, category);
    setBusy(false);
    if (result.ok) {
      setFile(null);
      setMessage({ ok: true, text: L('اتبعت طلبك، وهيتراجع قريب.', 'Your request was sent and will be reviewed soon.') });
      await load();
    } else {
      setMessage({ ok: false, text: result.error ?? L('حصلت مشكلة، جرّب تاني.', 'Something went wrong, please try again.') });
    }
  };

  const expired = info && !info.category && info.latest?.status === 'approved';
  const pending = info?.latest?.status === 'pending';
  const rejected = info?.latest?.status === 'rejected';

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">{L('الحساب', 'Account')}</span>
        <h1>{L('توثيق الفئة', 'Category verification')}</h1>
        <p>
          {L(
            'نصف التذكرة متاح لكبار السن (فوق ٦٠ سنة) وذوي الإعاقة، بعد مراجعة المستند.',
            'Half fare is available for seniors (over 60) and riders with disabilities, after your document is reviewed.',
          )}
        </p>
      </div>

      {!info ? (
        <p className="auth-sub">{L('بنحمّل…', 'Loading…')}</p>
      ) : info.category ? (
        <div className="network-card">
          <h3>{L('حسابك موثّق ✓', 'Your account is verified ✓')}</h3>
          <p>
            {L('الفئة', 'Category')}: {categoryName(info.category)}
          </p>
          <p>
            {L('التوثيق ساري لحد', 'Verification is valid until')} {info.until}.
          </p>
        </div>
      ) : pending ? (
        <div className="network-card">
          <h3>{L('قيد المراجعة', 'Under review')}</h3>
          <p>
            {L(
              'طلبك وصل وبيتراجع. هتقدر تحجز نصف تذكرة أول ما تتم الموافقة.',
              'Your request was received and is being reviewed. You can book a half ticket as soon as it is approved.',
            )}
          </p>
        </div>
      ) : (
        <div className="network-card">
          {expired && (
            <p>
              {L(
                'التوثيق القديم انتهى. ابعت مستند جديد عشان تجدّده.',
                'Your previous verification has expired. Send a new document to renew it.',
              )}
            </p>
          )}
          {rejected && (
            <p>
              {L(
                'طلبك السابق اترفض. تقدر تبعت مستند أوضح.',
                'Your previous request was rejected. You can send a clearer document.',
              )}
            </p>
          )}

          <h3>{L('ابعت طلب توثيق', 'Submit a verification request')}</h3>

          <label className="auth-sub" htmlFor="verify-category">
            {L('الفئة', 'Category')}
          </label>
          <select
            id="verify-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as VerificationCategory)}
          >
            {(Object.keys(categoryLabels) as VerificationCategory[]).map((key) => (
              <option key={key} value={key}>
                {categoryName(key)}
              </option>
            ))}
          </select>

          <label className="auth-sub" htmlFor="verify-file">
            {L(
              'صورة الهوية أو الكارنيه (JPG أو PNG أو WEBP أو PDF، لحد 5 ميجا)',
              'ID or card image (JPG, PNG, WEBP or PDF, up to 5 MB)',
            )}
          </label>
          <input
            id="verify-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <p className="auth-sub">
            {L(
              'المستند بيتخزن في مكان خاص، والمراجع (الأدمن) بس هو اللي يقدر يشوفه، ومابنستخدمه لأي حاجة غير التوثيق.',
              'Your document is stored privately. Only the reviewer (admin) can see it, and we use it for nothing except verification.',
            )}
          </p>

          <button className="dark-button" disabled={busy || !file} onClick={submit}>
            {busy ? L('بنرفع…', 'Uploading…') : L('ابعت الطلب', 'Send request')}
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
