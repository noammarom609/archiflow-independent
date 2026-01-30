// Auth helpers with bypass support

// Check for admin bypass token
export const checkAdminBypass = () => {
  const bypassToken = localStorage.getItem('adminBypassToken');
  const bypassUserStr = localStorage.getItem('adminBypassUser');
  
  if (bypassToken && bypassUserStr && bypassToken.startsWith('admin_bypass_')) {
    try {
      const bypassUser = JSON.parse(bypassUserStr);
      return { isValid: true, user: bypassUser };
    } catch (e) {
      // Invalid JSON, clear the bypass
      localStorage.removeItem('adminBypassToken');
      localStorage.removeItem('adminBypassUser');
    }
  }
  return { isValid: false, user: null };
};

// Get current user - checks bypass first, then uses Clerk user from context
// Note: This is now primarily used for bypass mode. Regular auth uses Clerk hooks.
export const getCurrentUser = async (clerkUser) => {
  const bypass = checkAdminBypass();
  if (bypass.isValid) {
    console.log('[AuthHelpers] Returning bypass Super Admin user');
    return bypass.user;
  }
  
  // If clerkUser is provided, map it to our user format
  if (clerkUser) {
    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      full_name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      image_url: clerkUser.imageUrl,
      role: clerkUser.publicMetadata?.role || 'user',
      app_role: clerkUser.publicMetadata?.app_role || 'user',
      allowed_pages: clerkUser.publicMetadata?.allowed_pages || [],
      created_at: clerkUser.createdAt,
    };
  }
  
  return null;
};

// Check if authenticated - checks bypass first
export const isAuthenticated = (isSignedIn) => {
  const bypass = checkAdminBypass();
  if (bypass.isValid) {
    return true;
  }
  return isSignedIn;
};

// Clear bypass tokens on logout
export const clearBypassTokens = () => {
  localStorage.removeItem('adminBypassToken');
  localStorage.removeItem('adminBypassUser');
};

// Helper to check user role
export const hasRole = (user, role) => {
  if (!user) return false;
  return user.role === role || user.app_role === role;
};

// Helper to check if user has access to a page
export const hasPageAccess = (user, pageName) => {
  if (!user) return false;
  if (user.app_role === 'Super Admin' || user.app_role === 'Admin') return true;
  if (!user.allowed_pages || user.allowed_pages.length === 0) return true; // No restrictions
  return user.allowed_pages.includes(pageName);
};
