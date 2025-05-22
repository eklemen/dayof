import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { Database } from '@/types/supabase';

export type User = Database['public']['Tables']['users']['Row'];

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted.current) {
          setSession(session);
          setLoading(false);
          if (session?.user) {
            fetchUser(session.user.id);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    // Delay the initialization to ensure component is mounted
    const initTimer = setTimeout(initializeAuth, 0);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isMounted.current) {
          setSession(session);
          if (session?.user) {
            await fetchUser(session.user.id);
          } else {
            setUser(null);
          }
        }
      }
    );

    return () => {
      isMounted.current = false;
      clearTimeout(initTimer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async (userId: string) => {
    if (!isMounted.current) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return;
      }

      if (data && isMounted.current) {
        setUser(data);
      }
    } catch (error) {
      console.error('Error in fetchUser:', error);
    }
  };

  const signInWithEmail = async (email: string) => {
    try {
      if (isMounted.current) {
        setLoading(true);
      }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'https://yourapp.com/auth/callback',
        },
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const signOut = async () => {
    try {
      if (isMounted.current) {
        setLoading(true);
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/login');
    } catch (error: any) {
      console.error('Error signing out:', error.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const createUserProfile = async (userData: Partial<User>) => {
    if (!session?.user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          email: session.user.email || '',
          ...userData,
        })
        .select()
        .single();

      if (error) throw error;
      if (isMounted.current) {
        setUser(data);
      }
      return { success: true, data, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  };

  return {
    session,
    user,
    loading,
    signInWithEmail,
    signOut,
    createUserProfile,
    refreshUser: () => session?.user?.id ? fetchUser(session.user.id) : null,
  };
}