import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../auth/authStore';
import {
  createHabit,
  fetchCompletions,
  fetchHabits,
  removeHabit,
  toggleCompletion
} from './api';
import { Completion, Habit } from '../../types/habit';
import { formatISO, startOfMonth, endOfMonth } from 'date-fns';

const habitsKey = (userId: string) => ['habits', userId];
const completionsKey = (userId: string, month: string) => ['completions', userId, month];

export function useHabits() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery<Habit[]>({
    queryKey: habitsKey(userId ?? 'anon'),
    queryFn: () => fetchHabits(userId!),
    enabled: Boolean(userId)
  });
}

export function useCreateHabit() {
  const userId = useAuthStore((s) => s.user?.id);
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ name, category }: { name: string; category: string }) =>
      createHabit(userId!, name, category),
    onSuccess: () => {
      if (userId) client.invalidateQueries({ queryKey: habitsKey(userId) });
    }
  });
}

export function useRemoveHabit() {
  const userId = useAuthStore((s) => s.user?.id);
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeHabit(id),
    onSuccess: () => {
      if (userId) client.invalidateQueries({ queryKey: habitsKey(userId) });
    }
  });
}

export function useMonthlyCompletions(month: Date) {
  const userId = useAuthStore((s) => s.user?.id);
  const from = formatISO(startOfMonth(month), { representation: 'date' });
  const to = formatISO(endOfMonth(month), { representation: 'date' });
  const monthKey = month.toISOString().slice(0, 7);

  return useQuery<Completion[]>({
    queryKey: completionsKey(userId ?? 'anon', monthKey),
    queryFn: () => fetchCompletions(userId!, from, to),
    enabled: Boolean(userId)
  });
}

export function useToggleCompletion(month: Date) {
  const userId = useAuthStore((s) => s.user?.id);
  const client = useQueryClient();
  const monthKey = month.toISOString().slice(0, 7);

  return useMutation({
    mutationFn: ({ habitId, date, completed }: { habitId: string; date: string; completed: boolean }) =>
      toggleCompletion(userId!, habitId, date, completed),
    onSuccess: () => {
      if (userId) client.invalidateQueries({ queryKey: completionsKey(userId, monthKey) });
    }
  });
}
