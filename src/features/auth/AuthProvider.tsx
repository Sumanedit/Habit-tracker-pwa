import { ReactNode, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from './authStore';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    init();
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [setSession, setLoading]);

  return <>{children}</>;
}
