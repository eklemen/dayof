import { supabase } from '@/src/lib/supabase';

function extractFragment(url: string) {
  // url after '#'
  return url.split('#')[1] ?? '';
}

export async function finishFacebookLogin(deepLink: string) {
  console.log('🚀 Starting finishFacebookLogin with URL:', deepLink);

  const fragment = extractFragment(deepLink);
  console.log('📄 Extracted fragment:', fragment);

  const params = Object.fromEntries(
    fragment.split('&').map(kv => kv.split('='))
  ) as Record<string, string>;

  const { access_token, refresh_token, expires_at, token_type } = params;

  if (!access_token) {
    throw new Error('No access token found in callback URL');
  }

  console.log('🔑 Token info:');
  console.log('  access_token length:', access_token.length);
  console.log('  refresh_token FROM URL:', refresh_token || 'MISSING');
  console.log('  expires_at:', expires_at);
  console.log('  token_type:', token_type);

  try {
    // Method 1: Try with both tokens if refresh token exists
    console.log('About to call setSession with:', { access_token: access_token.substring(0, 10) + '...', refresh_token: refresh_token ? 'present' : 'empty' });
    // if (refresh_token) {
    //   console.log('📡 Attempting setSession with both tokens...');
    //   const { data, error } = await supabase.auth.setSession({
    //     access_token: access_token,
    //     refresh_token: refresh_token,
    //   });
    //
    //   if (!error && data.session) {
    //     console.log('✅ SUCCESS with both tokens!');
    //     console.log('👤 User:', data.user?.email);
    //     return data.user;
    //   }
    //
    //   console.log('⚠️ Failed with both tokens, trying access token only...');
    //   console.log('Error was:', error?.message);
    // }
    //
    // // Method 2: Try with just access token (and calculate expiry)
    // console.log('📡 Attempting setSession with access token only...');
    //
    // // Calculate expires_at if we have it, otherwise use a default
    // const expiresAt = expires_at
    //   ? new Date(parseInt(expires_at) * 1000).toISOString()
    //   : new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour from now
    const { data: { session } } = await supabase.auth.getSession();
    console.log('📡 cached session →', session?.user?.email);

    await supabase.auth.setSession({
      access_token: access_token,
      refresh_token: '', // Empty refresh token
    }).then((data) => {
      console.log('data---------->', data);
    }).catch((err) => {
      console.log('err---------->', err);
    });
    //
    // if (!error2 && data2.session) {
    //   console.log('✅ SUCCESS with access token only!');
    //   console.log('👤 User:', data2.user?.email);
    //   console.log('⏰ Session expires:', data2.session.expires_at);
    //   return data2.user;
    // }
    //
    // console.error('❌ Both methods failed');
    // console.error('Method 1 error:', error?.message);
    // console.error('Method 2 error:', error2?.message);
    //
    // // Method 3: Last resort - try to manually set the user data
    // console.log('🆘 Last resort: trying to decode JWT and set user manually...');

    // try {
    //   // Decode the JWT to get user info (just for debugging)
    //   const payload = JSON.parse(atob(access_token.split('.')[1]));
    //   console.log('📝 JWT payload:', {
    //     email: payload.email,
    //     sub: payload.sub,
    //     exp: new Date(payload.exp * 1000).toISOString()
    //   });
    //
    //   // Return a user-like object
    //   return {
    //     id: payload.sub,
    //     email: payload.email,
    //     user_metadata: payload.user_metadata || {},
    //     app_metadata: payload.app_metadata || {},
    //   };
    //
    // } catch (decodeError) {
    //   console.error('❌ Could not decode JWT:', decodeError);
    //   throw new Error('Authentication failed - unable to process tokens');
    // }

  } catch (err) {
    console.error('💥 Exception in finishFacebookLogin:', err);
    throw err;
  }
}
