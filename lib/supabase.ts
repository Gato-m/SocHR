import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// Get Supabase URL and Anon Key from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  const error = new Error('Missing Supabase configuration');
  console.error('Supabase configuration error:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    error: error.message
  });
  throw error;
}

// Create a custom fetch with better error handling
const customFetch: typeof fetch = async (input, init = {}) => {
  const controller = new AbortController();
  const timeout = 15000; // 15 seconds
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Safely resolve a URL string from different possible request inputs
  const resolveRequestUrl = (inp: unknown): string => {
    if (typeof inp === 'string') return inp;
    try {
      // If inp is a URL instance
      if (typeof URL !== 'undefined' && inp instanceof URL) {
        return inp.toString();
      }
    } catch {}
    // If inp is a Request-like object with a url string
    const maybeUrl = (inp as any)?.url;
    if (typeof maybeUrl === 'string') return maybeUrl;
    return 'Unknown URL';
  };

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        ...init?.headers,
      },
    });

    clearTimeout(timeoutId);

    // Always return the response and let supabase-js/postgrest handle
    // non-2xx statuses and error parsing. We only throw on true
    // network-level failures (e.g., timeouts/aborts) below.
    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection.');
      }
      console.error('Request failed:', {
        url: resolveRequestUrl(input),
        error: error.message,
      });
    }
    throw error;
  }
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage on native, default storage (localStorage) on web
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web' ? true : false,
  },
  global: {
    fetch: customFetch,
  },
});

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
