import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from './authStore';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'reset'>('sign-in');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const loading = useAuthStore((s) => s.loading);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'reset') {
      if (!email) {
        setError('Email is required');
        return;
      }
      setSubmitting(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      setSubmitting(false);
      
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess('Password reset link sent to your email! Check your inbox.');
        setEmail('');
        setTimeout(() => setMode('sign-in'), 3000);
      }
      return;
    }

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
      <h2>
        {mode === 'sign-in' ? 'Sign In' : mode === 'sign-up' ? 'Create Account' : 'Reset Password'}
      </h2>
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
        {mode !== 'reset' && (
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
        )}
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit" disabled={loading || submitting}>
          {submitting
            ? 'Processing...'
            : mode === 'sign-in'
            ? 'Sign In'
            : mode === 'sign-up'
            ? 'Sign Up'
            : 'Send Reset Link'}
        </button>
      </form>
      
      {mode === 'sign-in' && (
        <>
          <button
            type="button"
            className="link"
            onClick={() => setMode('sign-up')}
          >
            Need an account? Sign up
          </button>
          <button
            type="button"
            className="link"
            style={{ marginTop: '8px', fontSize: '12px' }}
            onClick={() => setMode('reset')}
          >
            Forgot password?
          </button>
        </>
      )}

      {(mode === 'sign-up' || mode === 'reset') && (
        <button
          type="button"
          className="link"
          onClick={() => setMode('sign-in')}
        >
          Back to Sign In
        </button>
      )}
    </div>
  );
}
