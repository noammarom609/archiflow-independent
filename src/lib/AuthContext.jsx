import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import { supabase, createSupabaseClientWithToken } from '@/lib/supabase';
import { setAuthenticatedClient } from '@/api/entities';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const { signOut, openSignIn } = useClerk();
  
  const [supabaseClient, setSupabaseClient] = useState(supabase);
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isBypassMode, setIsBypassMode] = useState(false);

  // Check for admin bypass mode
  const checkAdminBypass = useCallback(() => {
    const bypassToken = localStorage.getItem('adminBypassToken');
    const bypassUserStr = localStorage.getItem('adminBypassUser');
    
    if (bypassToken && bypassUserStr && bypassToken.startsWith('admin_bypass_')) {
      try {
        const parsed = JSON.parse(bypassUserStr);
        // Ensure all test/bypass users are always treated as approved and active
        const bypassUser = {
          ...parsed,
          approval_status: parsed.approval_status || 'approved',
          status: parsed.status || 'active',
        };
        return { isValid: true, user: bypassUser };
      } catch (e) {
        localStorage.removeItem('adminBypassToken');
        localStorage.removeItem('adminBypassUser');
      }
    }
    return { isValid: false, user: null };
  }, []);

  // Initialize Supabase with Clerk token
  useEffect(() => {
    const initAuth = async () => {
      // Check if we're in the middle of logging out - don't do anything
      if (sessionStorage.getItem('archiflow_logging_out') === 'true') {
        console.log('[AuthContext] Logout in progress, skipping init');
        sessionStorage.removeItem('archiflow_logging_out');
        setIsLoadingAuth(false);
        return;
      }
      
      // Check for admin bypass first
      const bypass = checkAdminBypass();
      if (bypass.isValid) {
        console.log('[AuthContext] Admin bypass detected');
        setUser(bypass.user);
        setIsBypassMode(true);
        setIsLoadingAuth(false);
        return;
      }

      if (!isClerkLoaded) return;

      if (isSignedIn && clerkUser) {
        try {
          // Get Supabase JWT from Clerk
          const token = await getToken({ template: 'supabase' });
          
          let authenticatedClient = supabase;
          if (token) {
            // Create Supabase client with Clerk token
            authenticatedClient = createSupabaseClientWithToken(token);
            setSupabaseClient(authenticatedClient);
            // Update the global authenticated client for entities
            setAuthenticatedClient(authenticatedClient);
          }

          const userEmail = clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase();
          console.log('[AuthContext] Looking up user:', userEmail);
          
          // Check if user exists in Supabase users table
          // Use anon client for lookup (RLS allows public read)
          let supabaseUser = null;
          try {
            const { data: existingUser, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .ilike('email', userEmail) // Case-insensitive match
              .single();
            
            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
              console.log('[AuthContext] User fetch error:', fetchError.message, fetchError.code);
            } else if (existingUser) {
              supabaseUser = existingUser;
              console.log('[AuthContext] Found user in Supabase:', existingUser?.email, 'role:', existingUser?.app_role, 'status:', existingUser?.approval_status);
            } else {
              console.log('[AuthContext] User not found in Supabase for email:', userEmail);
            }
          } catch (e) {
            console.log('[AuthContext] Exception looking up user:', e.message);
          }

          // If user exists but clerk_id is missing, update it
          if (supabaseUser && !supabaseUser.clerk_id && clerkUser.id) {
            try {
              const { error: updateError } = await supabase
                .from('users')
                .update({ clerk_id: clerkUser.id })
                .eq('id', supabaseUser.id);
              
              if (!updateError) {
                supabaseUser.clerk_id = clerkUser.id;
                console.log('[AuthContext] Updated clerk_id for existing user');
              } else {
                console.warn('[AuthContext] Failed to update clerk_id:', updateError.message);
              }
            } catch (e) {
              console.warn('[AuthContext] Exception updating clerk_id:', e.message);
            }
          }

          // If user doesn't exist in Supabase, create them with pending status
          if (!supabaseUser && userEmail) {
            try {
              const { data: newUser, error: createError } = await supabase // Use anon client for insert (RLS allows it)
                .from('users')
                .insert({
                  email: userEmail,
                  full_name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
                  first_name: clerkUser.firstName,
                  last_name: clerkUser.lastName,
                  image_url: clerkUser.imageUrl,
                  clerk_id: clerkUser.id,
                  role: 'user',
                  app_role: 'user',
                  approval_status: 'pending',
                  status: 'pending_approval'
                  // created_at is auto-generated by database
                })
                .select()
                .single();
              
              if (!createError && newUser) {
                supabaseUser = newUser;
                console.log('[AuthContext] Created new user in Supabase with pending status');
              } else if (createError) {
                console.error('[AuthContext] Error creating user:', createError);
                // If insert fails (maybe RLS or column issues), still set pending status
              }
            } catch (createErr) {
              console.error('[AuthContext] Error creating user in Supabase:', createErr);
            }
          }

          // Map user - prioritize Supabase data over Clerk metadata
          const mappedUser = {
            id: supabaseUser?.id || clerkUser.id,
            email: userEmail,
            full_name: supabaseUser?.full_name || clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
            first_name: supabaseUser?.first_name || clerkUser.firstName,
            last_name: supabaseUser?.last_name || clerkUser.lastName,
            image_url: supabaseUser?.image_url || clerkUser.imageUrl,
            role: supabaseUser?.role || clerkUser.publicMetadata?.role || 'user',
            app_role: supabaseUser?.app_role || clerkUser.publicMetadata?.app_role || 'user',
            approval_status: supabaseUser?.approval_status || 'pending',
            status: supabaseUser?.status || 'pending_approval',
            allowed_pages: supabaseUser?.allowed_pages || clerkUser.publicMetadata?.allowed_pages || [],
            architect_id: supabaseUser?.architect_id,
            architect_email: supabaseUser?.architect_email || userEmail, // For multi-tenant time entries
            created_at: supabaseUser?.created_at || clerkUser.createdAt,
          };

          setUser(mappedUser);
          setAuthError(null);
        } catch (error) {
          console.error('[AuthContext] Error initializing auth:', error);
          setAuthError({
            type: 'auth_error',
            message: error.message || 'Failed to initialize authentication'
          });
        }
      } else {
        setUser(null);
        setSupabaseClient(supabase); // Reset to anonymous client
        setAuthenticatedClient(null); // Reset global authenticated client
      }

      setIsLoadingAuth(false);
    };

    initAuth();
  }, [isClerkLoaded, isSignedIn, clerkUser, getToken, checkAdminBypass]);

  // Refresh token periodically
  useEffect(() => {
    if (!isSignedIn) return;

    const refreshInterval = setInterval(async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        if (token) {
          const authenticatedClient = createSupabaseClientWithToken(token);
          setSupabaseClient(authenticatedClient);
          // Update the global authenticated client for entities
          setAuthenticatedClient(authenticatedClient);
        }
      } catch (error) {
        console.error('[AuthContext] Token refresh failed:', error);
      }
    }, 50000); // Refresh every 50 seconds (token expires in 60)

    return () => clearInterval(refreshInterval);
  }, [isSignedIn, getToken]);

  const logout = useCallback(async (shouldRedirect = true) => {
    console.log('[AuthContext] Logout initiated');
    
    // Clear state immediately
    setUser(null);
    setIsBypassMode(false);
    setSupabaseClient(supabase);
    // Reset the global authenticated client
    setAuthenticatedClient(null);
    
    // Clear admin bypass tokens
    localStorage.removeItem('adminBypassToken');
    localStorage.removeItem('adminBypassUser');
    
    // IMPORTANT: Redirect FIRST to stop Clerk from making API calls
    // This prevents the 401 loop
    if (shouldRedirect) {
      // Set a flag so we know we're logging out
      sessionStorage.setItem('archiflow_logging_out', 'true');
    }
    
    try {
      console.log('[AuthContext] Calling Clerk signOut...');
      // signOut will handle token cleanup and redirect
      await signOut({ redirectUrl: '/LandingHome' });
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error);
      // If signOut fails, force redirect to stop the loop
      if (shouldRedirect) {
        window.location.href = '/LandingHome';
      }
    }
  }, [signOut]);

  const navigateToLogin = useCallback(() => {
    const currentPath = window.location.pathname || '/';
    const landingPaths = ['/', '/LandingHome', '/LandingAbout', '/LandingPricing', '/LandingBlog', '/LandingContact', '/LandingPrivacy', '/LandingTerms'];
    const isOnLanding = landingPaths.some((p) => p === currentPath || currentPath.startsWith(p + '/'));
    const returnUrl = isOnLanding ? `${window.location.origin}/Dashboard` : window.location.href;
    openSignIn({
      afterSignInUrl: returnUrl,
      afterSignUpUrl: returnUrl,
    });
  }, [openSignIn]);

  const checkAppState = useCallback(async () => {
    // Re-check auth state
    setIsLoadingAuth(true);
    const bypass = checkAdminBypass();
    if (bypass.isValid) {
      setUser(bypass.user);
      setIsBypassMode(true);
    }
    setIsLoadingAuth(false);
  }, [checkAdminBypass]);

  // Provide the supabase client through context
  const value = {
    user,
    isAuthenticated: !!user || isSignedIn,
    isLoadingAuth: !isClerkLoaded || isLoadingAuth,
    isLoadingPublicSettings: false, // No longer needed with Clerk
    authError,
    appPublicSettings: null, // No longer needed with Clerk
    isBypassMode,
    logout,
    navigateToLogin,
    checkAppState,
    supabaseClient, // Expose the authenticated Supabase client
    clerkUser, // Expose the raw Clerk user if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook to get the authenticated Supabase client
export const useSupabase = () => {
  const { supabaseClient } = useAuth();
  return supabaseClient;
};
