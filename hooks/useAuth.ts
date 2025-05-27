import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { router } from 'expo-router';
import {
  makeRedirectUri,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { finishFacebookLogin } from '@/utils/supabaseTokenExtract';

WebBrowser.maybeCompleteAuthSession();               // ← 1-time call

export type User = Database['public']['Tables']['users']['Row'];

export function useAuth() {
  /* state */
  const [session, setSession] = useState<
    Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']
  >(null);
  const [user, setUser]     = useState<User | null>(null);
  const [loading, setLoad]  = useState(true);
  const mounted             = useRef(true);

  /* bootstrap */
  useEffect(() => {
    mounted.current = true;

    /* initial session */
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted.current) return;
      setSession(data.session);
      setLoad(false);
      data.session?.user && fetchUser(data.session.user.id);
    });

    /* auth change listener */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (!mounted.current) return;
        setSession(s);
        if (s?.user) {
          await fetchUser(s.user.id);
          router.replace('/(tabs)');
        } else setUser(null);
      }
    );

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  /* helpers */
  async function fetchUser(id: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    data && setUser(data);
  }

  /* email magic-link (unchanged) */
  async function signInWithEmail(email: string) {
    setLoad(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: makeRedirectUri({
          scheme: 'dayof',
          path: 'auth/callback',
        }),
      },
    });
    setLoad(false);
    return { success: !error, error };
  }

  /* Facebook OAuth */
  async function signInWithFacebook() {
    try {
      const redirectTo = makeRedirectUri({ scheme: 'dayof', path: 'auth/callback' })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.log('📱 WebBrowser result:', result);

      if (result.type === 'success' && result.url) {
        const user = await finishFacebookLogin(result.url);
        if (user) {
          console.log('✅ signed-in email →', user?.email);
        }
        return { success: true };
      }
    } catch (err) {
      console.log('err-------->', err);
      return { success: false, error: err?.message };
    }
  }

  async function signOut() {
    setLoad(true);
    await supabase.auth.signOut();
    router.replace('/login');
    setLoad(false);
  }

  async function createUserProfile(partial: Partial<User>) {
    if (!session?.user) return { success: false, error: 'not-auth' };
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: session.user.id, email: session.user.email, ...partial })
      .select()
      .single();
    data && setUser(data);
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
