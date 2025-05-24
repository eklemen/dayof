import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { Database } from '@/types/supabase';
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'

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
            router.replace('/(tabs)');
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

  WebBrowser.maybeCompleteAuthSession()

  const signInWithFacebook = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: AuthSession.makeRedirectUri({
            scheme: 'dayof',
            path: 'auth/callback'
          }),
        },
      })

      if (error) throw error

      // Open the OAuth URL in browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        AuthSession.makeRedirectUri({
          scheme: 'dayof',
          path: 'auth/callback'
        })
      )

      if (result.type === 'success') {
        // Handle the callback URL
        const { url } = result
        // Extract tokens from URL and complete auth if needed
        console.log('Auth success:', url)
        console.log('result---------->', result);
        setUser(result);
      }

    } catch (error) {
      console.error('Facebook login error:', error)
      throw error
    } finally {
      setLoading(false);
    }
  }

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
    signInWithFacebook,
    signOut,
    createUserProfile,
    refreshUser: () => session?.user?.id ? fetchUser(session.user.id) : null,
  };
}
