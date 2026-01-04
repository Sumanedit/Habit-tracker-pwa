import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from './authStore';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const loading = useAuthStore((s) => s.loading);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setSubmitting(true);
    const { data, error: authError } = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    
    setSubmitting(false);

    if (authError) {
      setError(authError.message);
    } else if (mode === 'sign-up' && data?.user && !data.session) {
      setSuccess('Check your email to confirm your account!');
      setEmail('');
      setPassword('');
    } else if (mode === 'sign-up' && data?.session) {
      setSuccess('Account created successfully!');
    }
  };

  return (
    <div className="auth-card">
      <h2>{mode === 'sign-in' ? 'Sign In' : 'Create Account'}</h2>
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit" disabled={loading || submitting}>
          {submitting ? 'Processing...' : mode === 'sign-in' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
      <button
        type="button"
        className="link"
        onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
      >
        {mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}
