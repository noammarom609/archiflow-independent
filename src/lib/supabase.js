import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create a single supabase client for the app (anonymous/unauthenticated)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Helper to create a client with Clerk JWT token (using the accessToken approach)
// This is the recommended approach per Clerk documentation
export const createSupabaseClientWithToken = (token) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
};

// Create a client with async accessToken function (for session-based auth)
// This approach is used when you have a function that returns the token
export const createSupabaseClientWithSession = (getTokenFn) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      try {
        const token = await getTokenFn({ template: 'supabase' });
        return token;
      } catch (e) {
        console.error('[Supabase] Failed to get token:', e);
        return null;
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
};

// Export for convenience
export { supabaseUrl, supabaseAnonKey };
