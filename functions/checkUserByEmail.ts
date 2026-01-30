import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Backend function to check if a user exists by email
 * Uses service role to bypass User entity permissions
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify the calling user is authenticated
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the request payload
    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Use service role to query User entity
    const users = await base44.asServiceRole.entities.User.filter({ email });
    const user = users[0] || null;
    
    if (user) {
      return Response.json({ 
        exists: true,
        user: {
          id: user.id,
          email: user.email,
          app_role: user.app_role,
          full_name: user.full_name,
          approval_status: user.approval_status,
          status: user.status
        }
      });
    }
    
    return Response.json({ 
      exists: false,
      user: null
    });
    
  } catch (error) {
    console.error('Check user error:', error);
    return Response.json({ 
      error: error.message || 'Failed to check user' 
    }, { status: 500 });
  }
});
