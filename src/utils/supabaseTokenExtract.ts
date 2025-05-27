import { supabase } from '@/src/lib/supabase';

function extractFragment(url: string) {
  // url after '#'
  return url.split('#')[1] ?? '';
}

export async function finishFacebookLogin(deepLink: string) {
  const fragment = extractFragment(deepLink);
  const params   = Object.fromEntries(
    fragment.split('&').map(kv => kv.split('='))
  ) as Record<string, string>;

  const { access_token, refresh_token } = params;

  if (!access_token || !refresh_token) {
    throw new Error('No tokens found in callback URL');
  }

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) throw error;
  return data.user;
}
