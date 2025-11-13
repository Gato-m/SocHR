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
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorData: any = {};
      
      try {
        // Try to parse error as JSON first
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          errorData = await response.json();
          errorMessage = errorData.message || errorData.error_description || errorMessage;
        } else {
          // If not JSON, try to get text
          const text = await response.text();
          if (text) {
            errorMessage = text;
            try {
              // Try to parse as JSON if it's a stringified JSON
              errorData = JSON.parse(text);
            } catch {
              errorData = { message: text };
            }
          }
        }
      } catch (parseError) {
        console.warn('Error parsing error response:', parseError);
      }
      
      // Ensure errorMessage is always a string
      const safeErrorMessage = typeof errorMessage === 'string' ? errorMessage : 'An unknown error occurred';
      const error = new Error(safeErrorMessage);
      
      // Add additional error context
      (error as any).status = response.status || 500;
      (error as any).data = errorData || {};
      (error as any).url = typeof input === 'string' ? input : input?.url || 'Unknown URL';
      
      console.error('API Error:', {
        message: safeErrorMessage,
        status: response.status,
        url: (error as any).url,
        data: errorData
      });
      
      throw error;
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection.');
      }
      console.error('Request failed:', {
        url: typeof input === 'string' ? input : input.url,
        error: error.message,
      });
    }
    throw error;
  }
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
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
