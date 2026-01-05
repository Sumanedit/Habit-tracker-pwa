import { Route, Routes, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from './features/auth/authStore';
import { AuthForm } from './features/auth/AuthForm';
import { ResetPasswordForm } from './features/auth/ResetPasswordForm';
import { ChangePasswordForm } from './features/auth/ChangePasswordForm';
import { Dashboard } from './features/analytics/Dashboard';
import { HabitsPage } from './features/habits/HabitsPage';

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="page">Loading session...</div>;
  if (!user) return <AuthForm />;
  return children;
}

export default function App() {
  const { user } = useAuthStore();
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">Habit Tracker</div>
        <nav>
          {user && (
            <>
              <Link to="/">Dashboard</Link>
              <Link to="/habits">Habits</Link>
              <Link to="/account/password">Change Password</Link>
            </>
          )}
        </nav>
        {user && <span className="user-tag">{user.email}</span>}
      </header>
      <main>
        <Routes>
          <Route path="/auth/reset-password" element={<ResetPasswordForm />} />
          <Route
            path="/account/password"
            element={
              <Protected>
                <ChangePasswordForm />
              </Protected>
            }
          />
          <Route
            path="/"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />
          <Route
            path="/habits"
            element={
              <Protected>
                <HabitsPage />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
