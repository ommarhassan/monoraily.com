import { supabase } from './supabase';

export type ComplaintCategory = 'complaint' | 'suggestion' | 'inquiry' | 'payment' | 'lost_item';
export type ComplaintStatus = 'new' | 'in_progress' | 'resolved';

export type Complaint = {
  id: string;
  /** Short reference the user can quote, e.g. CMP-3F9A12BC. */
  ref: string;
  user_id: string;
  name: string;
  email: string;
  category: ComplaintCategory;
  ticket_id: string | null;
  subject: string;
  message: string;
  status: ComplaintStatus;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
};

export type SubmitInput = {
  category: ComplaintCategory;
  subject: string;
  message: string;
  /** Optional: a ticket or subscription id that belongs to the sender. */
  ticket_id?: string;
  name?: string;
};

export type SubmitResult = { ok: true; ref: string } | { ok: false; code: string };

/** Reads the `error` code our Edge Function sends back (e.g. too_many). */
async function errorCode(error: unknown): Promise<string | null> {
  const res = (error as { context?: Response } | null)?.context;
  if (!res || typeof res.json !== 'function') return null;
  const body = await res.json().catch(() => null);
  return typeof body?.error === 'string' ? body.error : null;
}

/** Sends a message to the administration. The server saves it and emails the owner. */
export async function submitComplaint(input: SubmitInput): Promise<SubmitResult> {
  if (!supabase) return { ok: false, code: 'no_server' };
  const { data, error } = await supabase.functions.invoke('submit-complaint', { body: input });
  if (error || !data?.ok || typeof data.ref !== 'string') {
    return { ok: false, code: (await errorCode(error)) ?? 'unknown' };
  }
  return { ok: true, ref: data.ref };
}

/** The signed-in user's own messages (row level security enforces this on the server too). */
export async function myComplaints(): Promise<Complaint[]> {
  if (!supabase) return [];
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) console.error('myComplaints failed:', error.message, error);
  return (data ?? []) as Complaint[];
}

/** Admin inbox: every message, newest first. Only admins get rows back (row level security). */
export async function allComplaints(status?: ComplaintStatus): Promise<Complaint[]> {
  if (!supabase) return [];
  let query = supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(200);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) console.error('allComplaints failed:', error.message, error);
  return (data ?? []) as Complaint[];
}

/** Admin: change the status and/or write the reply the user will see. */
export async function updateComplaint(
  id: string,
  patch: { status?: ComplaintStatus; admin_reply?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };
  const { data, error } = await supabase.from('complaints').update(patch).eq('id', id).select('id');
  if (error) {
    console.error('updateComplaint failed:', error.message, error);
    return { ok: false, error: error.message };
  }
  // Row level security does not raise an error when it blocks a row: it just updates nothing.
  if (!data || data.length === 0) return { ok: false, error: 'not_allowed' };
  return { ok: true };
}
