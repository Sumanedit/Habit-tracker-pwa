import { format } from 'date-fns';
import { useState } from 'react';
import { useCreateHabit, useHabits, useMonthlyCompletions, useRemoveHabit, useToggleCompletion } from './hooks';
import { AddHabitForm } from './components/AddHabitForm';

export function HabitsPage() {
  const today = new Date();
  const dateStr = format(today, 'yyyy-MM-dd');
  const habitsQuery = useHabits();
  const completionsQuery = useMonthlyCompletions(today);
  const toggleCompletion = useToggleCompletion(today);
  const removeHabit = useRemoveHabit();
  const createHabit = useCreateHabit();
  const [selectedDate, setSelectedDate] = useState(dateStr);

  const habits = habitsQuery.data ?? [];
  const completions = completionsQuery.data ?? [];

  const handleToggle = (habitId: string, completed: boolean) => {
    toggleCompletion.mutate({ habitId, date: selectedDate, completed });
  };

  const isCompleted = (habitId: string) =>
    completions.some((c) => c.habit_id === habitId && c.date === selectedDate && c.completed);

  return (
    <div className="page">
      <div className="toolbar">
        <label>
          Date
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </label>
      </div>

      <AddHabitForm onAdd={(values) => createHabit.mutate(values)} loading={createHabit.isPending} />

      <div className="card">
        <h3>Habits</h3>
        {habitsQuery.isLoading ? (
          <p>Loading habits...</p>
        ) : habits.length === 0 ? (
          <p>No habits yet.</p>
        ) : (
          <ul className="habit-list">
            {habits.map((habit) => (
              <li key={habit.id} className="habit-item">
                <div>
                  <p className="habit-name">{habit.name}</p>
                  <p className="habit-meta">{habit.category}</p>
                </div>
                <div className="habit-actions">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={isCompleted(habit.id)}
                      onChange={(e) => handleToggle(habit.id, e.target.checked)}
                    />
                    <span>Done</span>
                  </label>
                  <button className="ghost" onClick={() => removeHabit.mutate(habit.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
