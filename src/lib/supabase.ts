import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values'

import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/src/types/supabase';

if (__DEV__) {
  const originalFetch = global.fetch;
  global.fetch = async (...args) => {
    const [url, options] = args;
    const urlString = typeof url === 'string' ? url : url.toString();

    // Only log Supabase requests to reduce noise
    if (urlString.includes('supabase.co')) {
      console.log('🚀 SUPABASE REQUEST:', urlString);
      console.log('📤 Method:', options?.method || 'GET');
      console.log('📤 Headers:', JSON.stringify(options?.headers, null, 2));
      if (options?.body) {
        console.log('📤 Body:', typeof options.body === 'string' ? options.body : '[Non-string body]');
      }
    }

    const startTime = Date.now();
    const response = await originalFetch(...args);
    const duration = Date.now() - startTime;

    if (urlString.includes('supabase.co')) {
      console.log('📥 SUPABASE RESPONSE:', {
        url: urlString,
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
      });

      // Try to log response body
      const responseClone = response.clone();
      try {
        const responseText = await responseClone.text();
        console.log('📥 Response Body:', responseText.length > 1000 ? responseText.substring(0, 1000) + '...' : responseText);
      } catch (e) {
        console.log('📥 Could not read response body');
      }
    }

    return response;
  };
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
  },
});
