import { supabase } from '../../lib/supabase';
import { Completion, Habit } from '../../types/habit';

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createHabit(userId: string, name: string, category: string): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: userId, name, category })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').update({ archived: true }).eq('id', id);
  if (error) throw error;
}

export async function fetchCompletions(userId: string, from: string, to: string): Promise<Completion[]> {
  const { data, error } = await supabase
    .from('completions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to);
  if (error) throw error;
  return data ?? [];
}

export async function toggleCompletion(
  userId: string,
  habitId: string,
  date: string,
  completed: boolean
): Promise<Completion | null> {
  const { data, error } = await supabase
    .from('completions')
    .upsert({ user_id: userId, habit_id: habitId, date, completed }, { onConflict: 'habit_id,date,user_id' })
    .select()
    .single();
  if (error) throw error;
  return data ?? null;
}
