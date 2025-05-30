import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Database } from '@/src/types/supabase';
import { router } from 'expo-router';
import {
  makeRedirectUri,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { finishFacebookLogin } from '@/src/utils/supabaseTokenExtract';

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
        console.log('session in onAuthStateChange---------->', s);
        // setSession(s);
        // if (s?.user) {
        //   await fetchUser(s.user.id);
        //   router.replace('/(tabs)');
        // } else setUser(null);
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
      const redirectTo = makeRedirectUri({ scheme: 'dayof', path: 'auth/callback' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo,
          queryParams: {
            response_type: 'code', // Facebook will still ignore this most likely
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
        { preferEphemeralSession: true }
      );

      if (result.type !== 'success' || !result.url) {
        return { success: false, error: 'Authentication cancelled or failed.' };
      }

      // Attempt code flow first (fails due to implicit flow)
      try {
        const res = await supabase.auth.exchangeCodeForSession(result.url);
        const { data: sessionData, error: sessionError } = res;
        if (sessionError || !sessionData.session) throw sessionError || new Error('Code flow failed');
        setSession(sessionData.session);
        sessionData.session.user && await fetchUser(sessionData.session.user.id);
        router.replace('/(tabs)');
        return { success: true };
      } catch (e) {
        console.warn('Code flow failed, falling back to implicit flow');

        // Extract access_token and refresh_token manually from hash
        const hash = result.url.split('#')[1];
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken || !refreshToken) {
          return { success: false, error: 'Unable to extract tokens from URL' };
        }

        const setSessionRes = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        console.log('setSessionRes---------->', setSessionRes);
        const { data: sessionData, error: sessionError } = setSessionRes;
        if (sessionError || !sessionData.session) {
          console.error('Failed to set session from tokens:', sessionError);
          return { success: false, error: sessionError?.message };
        }

        setSession(sessionData.session);
        sessionData.session.user && await fetchUser(sessionData.session.user.id);
        router.replace('/(tabs)');
        return { success: true };
      }
    } catch (err) {
      console.error('signInWithFacebook error:', err);
      return { success: false, error: err?.message ?? 'Unknown error' };
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
