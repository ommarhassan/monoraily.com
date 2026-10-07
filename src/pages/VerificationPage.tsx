import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  categoryLabels,
  myVerification,
  statusLabels,
  submitVerification,
  type MyVerification,
  type VerificationCategory,
} from '../lib/verification';

export default function VerificationPage() {
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

  const submit = async () => {
    if (!file) {
      setMessage({ ok: false, text: 'اختار صورة الهوية الأول.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await submitVerification(file, category);
    setBusy(false);
    if (result.ok) {
      setFile(null);
      setMessage({ ok: true, text: 'اتبعت طلبك، وهيتراجع قريب.' });
      await load();
    } else {
      setMessage({ ok: false, text: result.error ?? 'حصلت مشكلة، جرّب تاني.' });
    }
  };

  const expired = info && !info.category && info.latest?.status === 'approved';
  const pending = info?.latest?.status === 'pending';
  const rejected = info?.latest?.status === 'rejected';

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">الحساب</span>
        <h1>توثيق الفئة</h1>
        <p>نصف التذكرة متاح لكبار السن (فوق ٦٠ سنة) وذوي الإعاقة، بعد مراجعة المستند.</p>
      </div>

      {!info ? (
        <p className="auth-sub">بنحمّل…</p>
      ) : info.category ? (
        <div className="network-card">
          <h3>حسابك موثّق ✓</h3>
          <p>الفئة: {categoryLabels[info.category]}</p>
          <p>التوثيق ساري لحد {info.until}.</p>
        </div>
      ) : pending ? (
        <div className="network-card">
          <h3>{statusLabels.pending}</h3>
          <p>طلبك وصل وبيتراجع. هتقدر تحجز نصف تذكرة أول ما تتم الموافقة.</p>
        </div>
      ) : (
        <div className="network-card">
          {expired && <p>التوثيق القديم انتهى. ابعت مستند جديد عشان تجدّده.</p>}
          {rejected && <p>طلبك السابق اترفض. تقدر تبعت مستند أوضح.</p>}

          <h3>ابعت طلب توثيق</h3>

          <label className="auth-sub" htmlFor="verify-category">
            الفئة
          </label>
          <select
            id="verify-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as VerificationCategory)}
          >
            {(Object.keys(categoryLabels) as VerificationCategory[]).map((key) => (
              <option key={key} value={key}>
                {categoryLabels[key]}
              </option>
            ))}
          </select>

          <label className="auth-sub" htmlFor="verify-file">
            صورة الهوية أو الكارنيه (JPG أو PNG أو WEBP أو PDF، لحد 5 ميجا)
          </label>
          <input
            id="verify-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <p className="auth-sub">
            المستند بيتخزن في مكان خاص، والمراجع (الأدمن) بس هو اللي يقدر يشوفه، ومابنستخدمه لأي حاجة غير التوثيق.
          </p>

          <button className="dark-button" disabled={busy || !file} onClick={submit}>
            {busy ? 'بنرفع…' : 'ابعت الطلب'}
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
