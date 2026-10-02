import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type Profile = { id: string; full_name: string; role: 'user' | 'admin' };
type Result = Promise<string | null>; // null = success, string = Arabic error message
type Ctx = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  recovery: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsVerify: boolean }>;
  signIn: (email: string, password: string) => Result;
  signOut: () => Promise<void>;
  forgot: (email: string) => Result;
  resetPassword: (password: string) => Result;
  resend: (email: string) => Result;
  updateName: (name: string) => Result;
};
const AuthCtx = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthCtx);

const errors: [RegExp, string][] = [
  [/invalid login credentials/i, 'الإيميل أو كلمة السر غلط'],
  [/email not confirmed/i, 'لازم تفعّل الإيميل الأول. افتح الرسالة اللي وصلتلك واضغط على رابط التفعيل'],
  [/already registered|already been registered/i, 'الإيميل ده مسجّل قبل كده. جرّب تسجّل دخول'],
  [/password should be at least/i, 'كلمة السر لازم تكون ٨ حروف على الأقل'],
  [/rate limit|too many/i, 'محاولات كتير. استنى شوية وجرّب تاني'],
  [/same password/i, 'كلمة السر الجديدة لازم تختلف عن القديمة'],
  [/network|fetch/i, 'مشكلة في الاتصال بالإنترنت'],
];
const arabic = (m: string) => errors.find(([re]) => re.test(m))?.[1] ?? 'حصلت مشكلة غير متوقعة. جرّب تاني';
const back = () => location.origin + location.pathname;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') setProfile(null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      setProfile(null);
      return;
    }
    let cancel = false;
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!cancel && data) setProfile(data as Profile);
      });
    return () => {
      cancel = true;
    };
  }, [user?.id]);

  const signUp: Ctx['signUp'] = async (email, password, name) => {
    if (!supabase) return { error: 'السيرفر مش متظبّط', needsVerify: false };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: back() },
    });
    if (error) return { error: arabic(error.message), needsVerify: false };
    // Supabase returns an empty identities list (and no error) when the email already exists.
    if (data.user && data.user.identities?.length === 0)
      return { error: arabic('already registered'), needsVerify: false };
    return { error: null, needsVerify: !data.session };
  };
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    return error ? arabic(error.message) : null;
  };
  const signOut = async () => {
    await supabase?.auth.signOut();
    setUser(null);
    setProfile(null);
  };
  const forgot = async (email: string) => {
    const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: back() });
    return error ? arabic(error.message) : null;
  };
  const resetPassword = async (password: string) => {
    const { error } = await supabase!.auth.updateUser({ password });
    if (!error) setRecovery(false);
    return error ? arabic(error.message) : null;
  };
  const resend = async (email: string) => {
    const { error } = await supabase!.auth.resend({ type: 'signup', email, options: { emailRedirectTo: back() } });
    return error ? arabic(error.message) : null;
  };
  const updateName = useCallback(
    async (name: string) => {
      if (!supabase || !user) return 'لازم تسجّل دخول';
      const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
      if (!error) setProfile((p) => (p ? { ...p, full_name: name } : p));
      return error ? arabic(error.message) : null;
    },
    [user],
  );

  const value = useMemo<Ctx>(
    () => ({
      user,
      profile,
      loading,
      recovery,
      isAdmin: profile?.role === 'admin',
      signUp,
      signIn,
      signOut,
      forgot,
      resetPassword,
      resend,
      updateName,
    }),
    [user, profile, loading, recovery, updateName],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
