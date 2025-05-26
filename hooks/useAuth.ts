import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { router } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export type User = Database['public']['Tables']['users']['Row'];

export function useAuth() {
  const [session, setSession] = useState<null | Awaited<
    ReturnType<typeof supabase.auth.getSession>
  >['data']['session']>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted.current) return;
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) fetchUser(data.session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_evt, s) => {
        if (!mounted.current) return;
        setSession(s);
        if (s?.user) {
          await fetchUser(s.user.id);
          router.replace('/(tabs)');
        } else {
          setUser(null);
        }
      }
    );

    // Handle deep links - this is crucial for OAuth callbacks
    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);
      // Supabase will automatically handle the session via onAuthStateChange
      // when the deep link contains the auth tokens
    };

    // Listen for deep links
    const subscription2 = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
      subscription2?.remove();
    };
  }, []);

  async function fetchUser(id: string) {
    if (!mounted.current) return;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) setUser(data);
  }

  async function signInWithEmail(email: string) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: makeRedirectUri({
          scheme: 'dayof',
          path: 'auth/callback',
        }),
      },
    });
    setLoading(false);
    return { success: !error, error };
  }

  async function signInWithFacebook() {
    try {
      // Create the redirect URI that matches your app scheme
      const redirectTo = makeRedirectUri({
        scheme: 'dayof',
        path: 'auth/callback',
      });

      console.log('=== FACEBOOK AUTH (DEEP LINK VERSION) ===');
      console.log('Redirect URI:', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo,
        },
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        return { success: false, error: error.message };
      }

      console.log('Opening OAuth URL:', data.url);

      // Open the browser for authentication
      const res = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      console.log('WebBrowser result:', res);

      if (res.type === 'success') {
        console.log('✅ OAuth flow completed successfully');
        // The onAuthStateChange listener will handle the rest
        return { success: true, error: null };
      }

      if (res.type === 'cancel') {
        return { success: false, error: 'User cancelled authentication' };
      }

      return { success: false, error: 'Authentication failed' };

    } catch (error) {
      console.error('Facebook auth error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();
    router.replace('/login');
    setLoading(false);
  }

  async function createUserProfile(partial: Partial<User>) {
    if (!session?.user) return { success: false, error: 'not-auth' };
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: session.user.id, email: session.user.email, ...partial })
      .select()
      .single();
    if (!error && data) setUser(data);
    return { success: !error, data, error };
  }

  return {
    session,
    user,
    loading,
    signInWithEmail,
    signInWithFacebook,
    signOut,
    createUserProfile,
    refreshUser: () => session?.user && fetchUser(session.user.id),
  };
}
