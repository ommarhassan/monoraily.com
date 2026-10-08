import { supabase } from './supabase';
import type { Ticket } from './ticketing';

export type DbTicket = {
  id: string;
  user_id: string;
  rider_name: string;
  from_station: string;
  to_station: string;
  fare: number;
  stops: number;
  pay: string;
  exp: string;
  created_at: string;
  kind: 'full' | 'half';
  passengers: number;
  entries_used: number;
  line: string;
  /** Advance booking: the ticket only works from this moment. Null = valid from purchase. */
  valid_from: string | null;
};

export type DbSubscription = {
  id: string;
  user_id: string;
  plan: 'weekly' | 'monthly' | 'quarterly';
  zone: number;
  holder_name: string;
  trips_total: number;
  trips_used: number;
  fare: number;
  pay: string | null;
  starts_at: string;
  expires_at: string;
  created_at: string;
};

export type DbProfile = {
  id: string;
  full_name: string;
  role: 'user' | 'admin';
  created_at: string;
  verified_category: 'senior' | 'disabled' | null;
  verified_until: string | null;
};

export type SaveResult = { ok: boolean; error?: string };

export async function saveTicket(ticket: Ticket, userId: string): Promise<SaveResult> {
  if (!supabase) {
    console.error('saveTicket: Supabase client is null (المفاتيح مش داخلة ف الـ build)');
    return { ok: false, error: 'Supabase not configured' };
  }
  const { error } = await supabase.from('tickets').insert({
    id: ticket.id,
    user_id: userId,
    rider_name: ticket.name,
    from_station: ticket.from,
    to_station: ticket.to,
    fare: ticket.fare,
    stops: ticket.stops,
    pay: ticket.pay,
    exp: new Date(ticket.exp).toISOString(),
  });
  if (error) {
    console.error('saveTicket failed:', error.message, error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** The signed-in user's own tickets only (admins can read everyone's, so we filter explicitly). */
export async function myTickets(): Promise<DbTicket[]> {
  if (!supabase) return [];
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) console.error('myTickets failed:', error.message, error);
  return (data ?? []) as DbTicket[];
}

/** The signed-in user's own subscriptions only. */
export async function mySubscriptions(): Promise<DbSubscription[]> {
  if (!supabase) return [];
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) console.error('mySubscriptions failed:', error.message, error);
  return (data ?? []) as DbSubscription[];
}

export async function adminData() {
  if (!supabase) {
    return { users: [] as DbProfile[], tickets: [] as DbTicket[], subscriptions: [] as DbSubscription[] };
  }
  const [users, tickets, subscriptions] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).limit(500),
  ]);
  if (users.error) console.error('adminData users failed:', users.error.message, users.error);
  if (tickets.error) console.error('adminData tickets failed:', tickets.error.message, tickets.error);
  if (subscriptions.error) {
    console.error('adminData subscriptions failed:', subscriptions.error.message, subscriptions.error);
  }
  // RLS returns everything only for admins
  return {
    users: (users.data ?? []) as DbProfile[],
    tickets: (tickets.data ?? []) as DbTicket[],
    subscriptions: (subscriptions.data ?? []) as DbSubscription[],
  };
}
