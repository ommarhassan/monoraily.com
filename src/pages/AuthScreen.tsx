import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../config/brand';
import { useLanguage } from '../i18n/LanguageContext';
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
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  /** Pick the Arabic or English text for the current language. */
  const tx = (ar: string, en: string) => (isAr ? ar : en);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const titles: Record<AuthMode, [string, string]> = {
    login: [
      tx('أهلًا بعودتك', 'Welcome back'),
      tx('سجّل دخولك عشان تحجز وتتابع تذاكرك.', 'Sign in to book and track your tickets.'),
    ],
    register: [
      tx('أنشئ حسابك', 'Create your account'),
      tx('حساب واحد لكل تذاكرك ورحلاتك.', 'One account for all your tickets and trips.'),
    ],
    forgot: [
      tx('نسيت كلمة السر؟', 'Forgot your password?'),
      tx('اكتب إيميلك وهنبعتلك رابط لإعادة التعيين.', "Enter your email and we'll send you a reset link."),
    ],
    reset: [
      tx('كلمة سر جديدة', 'New password'),
      tx('اختار كلمة سر جديدة لحسابك.', 'Choose a new password for your account.'),
    ],
    verify: [
      tx('تحقق من إيميلك', 'Check your email'),
      tx(
        `بعتنا رابط تفعيل على ${email}. افتحه عشان تفعّل حسابك.`,
        `We sent an activation link to ${email}. Open it to activate your account.`,
      ),
    ],
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (mode !== 'reset' && !emailOk(email)) return setError(tx('اكتب إيميل صحيح', 'Enter a valid email'));
    if ((mode === 'register' || mode === 'reset') && password.length < 8)
      return setError(tx('كلمة السر لازم تكون ٨ حروف على الأقل', 'Password must be at least 8 characters'));
    if (mode === 'register' && name.trim().length < 2) return setError(tx('اكتب اسمك', 'Enter your name'));
    setBusy(true);
    try {
      if (mode === 'login') {
        const err = await auth.signIn(email, password);
        if (err) {
          setError(err);
          if (/فعّل/.test(err))
            setInfo(
              tx(
                'لو الرسالة ماوصلتش، دوس «إعادة إرسال رسالة التفعيل».',
                'If the message did not arrive, tap "Resend activation email".',
              ),
            );
        }
      } else if (mode === 'register') {
        const r = await auth.signUp(email, password, name.trim());
        if (r.error) setError(r.error);
        else if (r.needsVerify) setMode('verify');
      } else if (mode === 'forgot') {
        const err = await auth.forgot(email);
        if (err) setError(err);
        else
          setInfo(
            tx(
              'لو الإيميل مسجّل عندنا، هتوصلك رسالة فيها رابط إعادة التعيين.',
              'If the email is registered with us, you will receive a message with a reset link.',
            ),
          );
      } else if (mode === 'reset') {
        const err = await auth.resetPassword(password);
        if (err) setError(err);
        else setInfo(tx('تم تغيير كلمة السر ✓', 'Password changed ✓'));
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    const err = await auth.resend(email);
    setBusy(false);
    err ? setError(err) : setInfo(tx('بعتنا رسالة التفعيل تاني.', 'We sent the activation email again.'));
  };

  const [title, sub] = titles[mode];
  const submitLabel: Record<AuthMode, string> = {
    login: tx('تسجيل الدخول', 'Sign in'),
    register: tx('إنشاء الحساب', 'Create account'),
    forgot: tx('ابعت الرابط', 'Send link'),
    reset: tx('حفظ كلمة السر', 'Save password'),
    verify: '',
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card result-card">
        <span className="eyebrow green">{brand.name}</span>
        <h1>{title}</h1>
        <p className="auth-sub">{sub}</p>
        {notice && mode !== 'verify' && <p className="auth-note">{notice}</p>}
        {!configured && (
          <p className="form-error" role="alert">
            {tx(
              'إعدادات Supabase ناقصة. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY (اقرأ ملف .env.example).',
              'Supabase settings are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see the .env.example file).',
            )}
          </p>
        )}
        {mode === 'verify' ? (
          <>
            <button className="dark-button full" disabled={busy} onClick={resend}>
              {tx('إعادة إرسال رسالة التفعيل', 'Resend activation email')}
            </button>
            <button className="outline-button full" onClick={() => setMode('login')}>
              {tx('رجوع لتسجيل الدخول', 'Back to sign in')}
            </button>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            {mode === 'register' && (
              <>
                <label className="name-label" htmlFor="a-name">
                  {tx('الاسم', 'Name')}
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
                  {tx('الإيميل', 'Email')}
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
                  {mode === 'reset' ? tx('كلمة السر الجديدة', 'New password') : tx('كلمة السر', 'Password')}
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
              {busy ? tx('استنى…', 'Please wait…') : submitLabel[mode]}
            </button>
            {error && /فعّل/.test(error) && (
              <button type="button" className="outline-button full" onClick={resend}>
                {tx('إعادة إرسال رسالة التفعيل', 'Resend activation email')}
              </button>
            )}
            <div className="auth-links">
              {mode === 'login' && (
                <>
                  <button type="button" onClick={() => setMode('forgot')}>
                    {tx('نسيت كلمة السر؟', 'Forgot your password?')}
                  </button>
                  <button type="button" onClick={() => setMode('register')}>
                    {tx('مفيش عندي حساب', "I don't have an account")}
                  </button>
                </>
              )}
              {mode === 'register' && (
                <button type="button" onClick={() => setMode('login')}>
                  {tx('عندي حساب بالفعل', 'I already have an account')}
                </button>
              )}
              {mode === 'forgot' && (
                <button type="button" onClick={() => setMode('login')}>
                  {tx('رجوع', 'Back')}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
