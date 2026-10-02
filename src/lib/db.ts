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
};

export type DbProfile = { id: string; full_name: string; role: 'user' | 'admin'; created_at: string };

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

export async function myTickets(): Promise<DbTicket[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) console.error('myTickets failed:', error.message, error);
  return (data ?? []) as DbTicket[]; // RLS limits this to the signed-in user's rows
}

export async function adminData() {
  if (!supabase) return { users: [] as DbProfile[], tickets: [] as DbTicket[] };
  const [users, tickets] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(500),
  ]);
  if (users.error) console.error('adminData users failed:', users.error.message, users.error);
  if (tickets.error) console.error('adminData tickets failed:', tickets.error.message, tickets.error);
  // RLS returns everything only for admins
  return { users: (users.data ?? []) as DbProfile[], tickets: (tickets.data ?? []) as DbTicket[] };
}
