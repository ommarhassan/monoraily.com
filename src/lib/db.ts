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

export async function saveTicket(ticket: Ticket, userId: string) {
  if (!supabase) return;
  await supabase.from('tickets').insert({
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
}

export async function myTickets(): Promise<DbTicket[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
  return (data ?? []) as DbTicket[]; // RLS limits this to the signed-in user's rows
}

export async function adminData() {
  if (!supabase) return { users: [] as DbProfile[], tickets: [] as DbTicket[] };
  const [users, tickets] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(500),
  ]);
  // RLS returns everything only for admins
  return { users: (users.data ?? []) as DbProfile[], tickets: (tickets.data ?? []) as DbTicket[] };
}
