import { FormEvent, useState } from 'react';

interface AddHabitFormProps {
  onAdd: (payload: { name: string; category: string }) => void;
  loading?: boolean;
}

export function AddHabitForm({ onAdd, loading }: AddHabitFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name, category });
    setName('');
  };

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h3>Add Habit</h3>
      <label>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Read 10 pages"
          required
        />
      </label>
      <label>
        Category
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Health"
          required
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Habit'}
      </button>
    </form>
  );
}
