export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: string;
  created_at: string;
  archived: boolean;
}

export interface Completion {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}
