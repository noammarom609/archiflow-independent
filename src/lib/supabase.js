import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Singleton storage key for identifying our client
const STORAGE_KEY = 'archiflow-supabase';

// Create a single supabase client for the app (anonymous/unauthenticated)
// This is the ONLY anonymous client that should exist in the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storageKey: STORAGE_KEY
  }
});

// Cache for authenticated clients to prevent multiple GoTrueClient instances
// Key: token hash, Value: { client, timestamp }
const authenticatedClientCache = new Map();
const CACHE_TTL = 55000; // 55 seconds (tokens expire in 60s)

// Simple hash function for token caching
const hashToken = (token) => {
  if (!token) return 'empty';
  // Use last 16 chars of token as hash (JWT tokens are unique at the end)
  return token.slice(-16);
};

// Clean up expired cached clients
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of authenticatedClientCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      authenticatedClientCache.delete(key);
    }
  }
};

// Helper to create a client with Clerk JWT token (using the accessToken approach)
// This is the recommended approach per Clerk documentation
// Uses caching to prevent multiple GoTrueClient instances
export const createSupabaseClientWithToken = (token) => {
  if (!token) {
    console.warn('[Supabase] No token provided, returning anonymous client');
    return supabase;
  }

  const tokenHash = hashToken(token);
  
  // Check cache first
  const cached = authenticatedClientCache.get(tokenHash);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.client;
  }

  // Clean up old entries periodically
  if (authenticatedClientCache.size > 5) {
    cleanupCache();
  }

  // Create new client with unique storage key to avoid conflicts
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storageKey: `${STORAGE_KEY}-auth-${tokenHash}`
    }
  });

  // Cache the client
  authenticatedClientCache.set(tokenHash, {
    client,
    timestamp: Date.now()
  });

  return client;
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
      detectSessionInUrl: false,
      storageKey: `${STORAGE_KEY}-session`
    }
  });
};

// Export for convenience
export { supabaseUrl, supabaseAnonKey };
