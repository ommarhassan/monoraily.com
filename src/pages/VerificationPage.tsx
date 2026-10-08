import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  categoryLabels,
  myVerification,
  statusLabels,
  submitVerification,
  type MyVerification,
  type VerificationCategory,
} from '../lib/verification';

export default function VerificationPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const [info, setInfo] = useState<MyVerification | null>(null);
  const [category, setCategory] = useState<VerificationCategory>('senior');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => setInfo(await myVerification());

  useEffect(() => {
    void load();
  }, [user?.id]);

  const getCatLabel = (key: VerificationCategory) =>
    isAr ? categoryLabels[key] : key === 'senior' ? 'Seniors (over 60)' : 'People with disabilities';

  const submit = async () => {
    if (!file) {
      setMessage({ ok: false, text: isAr ? 'اختار صورة الهوية الأول.' : 'Select an ID document first.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await submitVerification(file, category);
    setBusy(false);
    if (result.ok) {
      setFile(null);
      setMessage({ ok: true, text: isAr ? 'اتبعت طلبك، وهيتراجع قريب.' : 'Your request was sent and will be reviewed soon.' });
      await load();
    } else {
      const err = result.error
        ? isAr
          ? result.error
          : result.error === 'سجّل دخول الأول'
          ? 'Please sign in first'
          : result.error === 'الملف لازم يكون صورة (JPG أو PNG أو WEBP) أو PDF'
          ? 'File must be an image (JPG, PNG, WEBP) or PDF'
          : result.error === 'الملف أكبر من 5 ميجا'
          ? 'File size exceeds 5 MB'
          : result.error === 'عندك طلب قيد المراجعة بالفعل'
          ? 'You already have a request under review'
          : 'An error occurred, please try again.'
        : isAr ? 'حصلت مشكلة، جرّب تاني.' : 'An error occurred, please try again.';
      setMessage({ ok: false, text: err });
    }
  };

  const expired = info && !info.category && info.latest?.status === 'approved';
  const pending = info?.latest?.status === 'pending';
  const rejected = info?.latest?.status === 'rejected';

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">{isAr ? 'الحساب' : 'Account'}</span>
        <h1>{isAr ? 'توثيق الفئة' : 'Category Verification'}</h1>
        <p>
          {isAr
            ? 'نصف التذكرة متاح لكبار السن (فوق ٦٠ سنة) وذوي الإعاقة، بعد مراجعة المستند.'
            : 'Half-fare tickets are available to seniors (over 60) and people with disabilities, after document verification.'}
        </p>
      </div>

      {!info ? (
        <p className="auth-sub">{isAr ? 'بنحمّل…' : 'Loading…'}</p>
      ) : info.category ? (
        <div className="network-card">
          <h3>{isAr ? 'حسابك موثّق ✓' : 'Your Account is Verified ✓'}</h3>
          <p>{isAr ? `الفئة: ${getCatLabel(info.category)}` : `Category: ${getCatLabel(info.category)}`}</p>
          <p>{isAr ? `التوثيق ساري لحد ${info.until}.` : `Verification valid until ${info.until}.`}</p>
        </div>
      ) : pending ? (
        <div className="network-card">
          <h3>{isAr ? statusLabels.pending : 'Under Review'}</h3>
          <p>
            {isAr
              ? 'طلبك وصل وبيتراجع. هتقدر تحجز نصف تذكرة أول ما تتم الموافقة.'
              : 'Your request was received and is under review. You can book half-fare tickets once approved.'}
          </p>
        </div>
      ) : (
        <div className="network-card">
          {expired && (
            <p>
              {isAr
                ? 'التوثيق القديم انتهى. ابعت مستند جديد عشان تجدّده.'
                : 'Your previous verification expired. Upload a new document to renew it.'}
            </p>
          )}
          {rejected && (
            <p>
              {isAr
                ? 'طلبك السابق اترفض. تقدر تبعت مستند أوضح.'
                : 'Your previous request was rejected. You can submit a clearer document.'}
            </p>
          )}

          <h3>{isAr ? 'ابعت طلب توثيق' : 'Submit Verification Request'}</h3>

          <label className="auth-sub" htmlFor="verify-category">
            {isAr ? 'الفئة' : 'Category'}
          </label>
          <select
            id="verify-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as VerificationCategory)}
          >
            {(Object.keys(categoryLabels) as VerificationCategory[]).map((key) => (
              <option key={key} value={key}>
                {getCatLabel(key)}
              </option>
            ))}
          </select>

          <label className="auth-sub" htmlFor="verify-file">
            {isAr
              ? 'صورة الهوية أو الكارنيه (JPG أو PNG أو WEBP أو PDF، لحد 5 ميجا)'
              : 'ID image or card photo (JPG, PNG, WEBP, or PDF up to 5 MB)'}
          </label>
          <input
            id="verify-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <p className="auth-sub">
            {isAr
              ? 'المستند بيتخزن في مكان خاص، والمراجع (الأدمن) بس هو اللي يقدر يشوفه، ومابنستخدمه لأي حاجة غير التوثيق.'
              : 'Documents are stored securely and privately for reviewer (admin) access only, solely for verification purposes.'}
          </p>

          <button className="dark-button" disabled={busy || !file} onClick={submit}>
            {busy ? (isAr ? 'بنرفع…' : 'Uploading…') : isAr ? 'ابعت الطلب' : 'Submit Request'}
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
