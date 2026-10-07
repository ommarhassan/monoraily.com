import type { TextKey } from '../i18n/dictionary';
import { supabase } from './supabase';

export type VerificationCategory = 'senior' | 'disabled';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type VerificationRequest = {
  id: string;
  user_id: string;
  category: VerificationCategory;
  doc_path: string;
  status: VerificationStatus;
  created_at: string;
  reviewed_at: string | null;
};

export const categoryLabels: Record<VerificationCategory, string> = {
  senior: 'كبار السن (فوق ٦٠ سنة)',
  disabled: 'ذوي الإعاقة',
};

export const statusLabels: Record<VerificationStatus, string> = {
  pending: 'قيد المراجعة',
  approved: 'تمت الموافقة',
  rejected: 'مرفوض',
};

export const MAX_DOC_BYTES = 5 * 1024 * 1024;
const BUCKET = 'verification-docs';
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

export type MyVerification = {
  /** Current approved category, if still valid. */
  category: VerificationCategory | null;
  /** Expiry date (YYYY-MM-DD) of the approval. */
  until: string | null;
  latest: VerificationRequest | null;
};

const currentUserId = async () => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
};

/** The signed-in user's verification state: active approval and their latest request. */
export async function myVerification(): Promise<MyVerification> {
  const empty: MyVerification = { category: null, until: null, latest: null };
  const userId = await currentUserId();
  if (!supabase || !userId) return empty;

  const [profile, latest] = await Promise.all([
    supabase.from('profiles').select('verified_category, verified_until').eq('id', userId).maybeSingle(),
    supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const p = profile.data as { verified_category: string | null; verified_until: string | null } | null;
  const latestRequest = (latest.data as VerificationRequest | null) ?? null;

  if (p?.verified_category && p.verified_until && p.verified_until >= today) {
    return { category: p.verified_category as VerificationCategory, until: p.verified_until, latest: latestRequest };
  }
  return { category: null, until: null, latest: latestRequest };
}

/**
 * `error` is the Arabic text (kept for older callers such as the admin page);
 * `errorKey` lets the page show the same message in the selected language.
 */
export type SubmitResult = { ok: boolean; error?: string; errorKey?: TextKey };

/** Uploads the ID document to the private bucket and opens a pending request. */
export async function submitVerification(file: File, category: VerificationCategory): Promise<SubmitResult> {
  const userId = await currentUserId();
  if (!supabase || !userId) return { ok: false, error: 'سجّل دخول الأول', errorKey: 'errSignInFirst' };
  if (!EXT[file.type]) {
    return { ok: false, error: 'الملف لازم يكون صورة (JPG أو PNG أو WEBP) أو PDF', errorKey: 'errFileType' };
  }
  if (file.size > MAX_DOC_BYTES) return { ok: false, error: 'الملف أكبر من 5 ميجا', errorKey: 'errFileSize' };

  const current = await myVerification();
  if (current.latest?.status === 'pending') {
    return { ok: false, error: 'عندك طلب قيد المراجعة بالفعل', errorKey: 'errPendingExists' };
  }

  const path = `${userId}/${crypto.randomUUID()}.${EXT[file.type]}`;
  const upload = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) {
    console.error('verification upload failed', upload.error.message);
    return { ok: false, error: 'مقدرناش نرفع الملف، جرّب تاني', errorKey: 'errUpload' };
  }

  const insert = await supabase
    .from('verification_requests')
    .insert({ user_id: userId, category, doc_path: path });
  if (insert.error) {
    console.error('verification request failed', insert.error.message);
    await supabase.storage.from(BUCKET).remove([path]);
    return { ok: false, error: 'مقدرناش نسجّل الطلب، جرّب تاني', errorKey: 'errRequest' };
  }
  return { ok: true };
}

// ---------------- Admin side ----------------

export type PendingRequest = VerificationRequest & { full_name: string };

/** Pending requests with the applicant's name (RLS lets admins read everything). */
export async function pendingRequests(): Promise<PendingRequest[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('pendingRequests failed', error.message);
    return [];
  }
  const rows = (data ?? []) as VerificationRequest[];
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids);
  const names = new Map<string, string>((profiles ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]));
  return rows.map((r) => ({ ...r, full_name: names.get(r.user_id) || 'بدون اسم' }));
}

/** Short-lived link to view a document (valid for one minute). */
export async function documentUrl(path: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error) {
    console.error('documentUrl failed', error.message);
    return null;
  }
  return data.signedUrl;
}

/** Approve or reject a request. The database function checks that the caller is an admin. */
export async function reviewRequest(id: string, approve: boolean): Promise<SubmitResult> {
  if (!supabase) return { ok: false, error: 'السيرفر مش متصل', errorKey: 'errServer' };
  const { error } = await supabase.rpc('review_verification', { p_id: id, p_approve: approve });
  if (error) {
    console.error('reviewRequest failed', error.message);
    return { ok: false, error: 'العملية فشلت', errorKey: 'errOperation' };
  }
  return { ok: true };
}
