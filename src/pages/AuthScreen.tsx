import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../config/brand';
import { configured } from '../lib/supabase';

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'verify';
const emailOk = (v: string) => /^\S+@\S+\.\S+$/.test(v);

export default function AuthScreen({
  mode,
  setMode,
  notice,
}: {
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
  notice?: string;
}) {
  const auth = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const titles: Record<AuthMode, [string, string]> = {
    login: ['أهلًا بعودتك', 'سجّل دخولك عشان تحجز وتتابع تذاكرك.'],
    register: ['أنشئ حسابك', 'حساب واحد لكل تذاكرك ورحلاتك.'],
    forgot: ['نسيت كلمة السر؟', 'اكتب إيميلك وهنبعتلك رابط لإعادة التعيين.'],
    reset: ['كلمة سر جديدة', 'اختار كلمة سر جديدة لحسابك.'],
    verify: ['تحقق من إيميلك', `بعتنا رابط تفعيل على ${email}. افتحه عشان تفعّل حسابك.`],
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (mode !== 'reset' && !emailOk(email)) return setError('اكتب إيميل صحيح');
    if ((mode === 'register' || mode === 'reset') && password.length < 8)
      return setError('كلمة السر لازم تكون ٨ حروف على الأقل');
    if (mode === 'register' && name.trim().length < 2) return setError('اكتب اسمك');
    setBusy(true);
    try {
      if (mode === 'login') {
        const err = await auth.signIn(email, password);
        if (err) {
          setError(err);
          if (/فعّل/.test(err)) setInfo('لو الرسالة ماوصلتش، دوس «إعادة إرسال رسالة التفعيل».');
        }
      } else if (mode === 'register') {
        const r = await auth.signUp(email, password, name.trim());
        if (r.error) setError(r.error);
        else if (r.needsVerify) setMode('verify');
      } else if (mode === 'forgot') {
        const err = await auth.forgot(email);
        if (err) setError(err);
        else setInfo('لو الإيميل مسجّل عندنا، هتوصلك رسالة فيها رابط إعادة التعيين.');
      } else if (mode === 'reset') {
        const err = await auth.resetPassword(password);
        if (err) setError(err);
        else setInfo('تم تغيير كلمة السر ✓');
      }
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    setBusy(true);
    const err = await auth.resend(email);
    setBusy(false);
    err ? setError(err) : setInfo('بعتنا رسالة التفعيل تاني.');
  };
  const [title, sub] = titles[mode];
  return (
    <div className="auth-wrap">
      <div className="auth-card result-card">
        <span className="eyebrow green">{brand.name}</span>
        <h1>{title}</h1>
        <p className="auth-sub">{sub}</p>
        {notice && mode !== 'verify' && <p className="auth-note">{notice}</p>}
        {!configured && (
          <p className="form-error" role="alert">
            إعدادات Supabase ناقصة. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY (اقرأ ملف .env.example).
          </p>
        )}
        {mode === 'verify' ? (
          <>
            <button className="dark-button full" disabled={busy} onClick={resend}>
              إعادة إرسال رسالة التفعيل
            </button>
            <button className="outline-button full" onClick={() => setMode('login')}>
              رجوع لتسجيل الدخول
            </button>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            {mode === 'register' && (
              <>
                <label className="name-label" htmlFor="a-name">
                  الاسم
                </label>
                <input
                  id="a-name"
                  className="name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  autoComplete="name"
                />
              </>
            )}
            {mode !== 'reset' && (
              <>
                <label className="name-label" htmlFor="a-email">
                  الإيميل
                </label>
                <input
                  id="a-email"
                  className="name-input"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </>
            )}
            {mode !== 'forgot' && (
              <>
                <label className="name-label" htmlFor="a-pass">
                  {mode === 'reset' ? 'كلمة السر الجديدة' : 'كلمة السر'}
                </label>
                <input
                  id="a-pass"
                  className="name-input"
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {info && (
              <p className="auth-note" role="status">
                {info}
              </p>
            )}
            <button className="dark-button full modal-action" disabled={busy || !configured} type="submit">
              {busy
                ? 'استنى…'
                : {
                    login: 'تسجيل الدخول',
                    register: 'إنشاء الحساب',
                    forgot: 'ابعت الرابط',
                    reset: 'حفظ كلمة السر',
                    verify: '',
                  }[mode]}
            </button>
            {error && /فعّل/.test(error) && (
              <button type="button" className="outline-button full" onClick={resend}>
                إعادة إرسال رسالة التفعيل
              </button>
            )}
            <div className="auth-links">
              {mode === 'login' && (
                <>
                  <button type="button" onClick={() => setMode('forgot')}>
                    نسيت كلمة السر؟
                  </button>
                  <button type="button" onClick={() => setMode('register')}>
                    مفيش عندي حساب
                  </button>
                </>
              )}
              {mode === 'register' && (
                <button type="button" onClick={() => setMode('login')}>
                  عندي حساب بالفعل
                </button>
              )}
              {mode === 'forgot' && (
                <button type="button" onClick={() => setMode('login')}>
                  رجوع
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
