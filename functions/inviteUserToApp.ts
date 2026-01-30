import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Backend function to invite users to the app
 * Uses auth.inviteUser to send invitation
 * This allows architects (who are not platform admins) to invite users
 * Only authenticated users can call this
 * 
 * IMPORTANT: We don't try to update User entity here because:
 * 1. User entity has special security rules - only admins can list/filter users
 * 2. The invited user will get proper metadata when they first login
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
    const { 
      email, 
      role, 
      full_name,
      app_role,
      entityType,
      entityId
    } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Validate role - only allow 'user' or 'admin'
    const platformRole = role === 'admin' ? 'admin' : 'user';
    
    // Use auth.inviteUser - this is the correct method
    // This works for any authenticated user, not just admins
    await base44.auth.inviteUser(email, platformRole);
    
    // Update entity user_status to 'invited' if entityId and entityType provided
    // This is safe because we're updating entities (not User), which the architect owns
    if (entityId && entityType) {
      const entityMap = {
        consultant: base44.entities.Consultant,
        contractor: base44.entities.Contractor,
        client: base44.entities.Client,
        team_member: base44.entities.TeamMember,
      };
      const entity = entityMap[entityType];
      if (entity) {
        try {
          await entity.update(entityId, { 
            user_status: 'invited',
            user_invited_at: new Date().toISOString(),
          });
        } catch (entityError) {
          console.error('Error updating entity status:', entityError);
          // Don't fail - invitation was sent successfully
        }
      }
    }
    
    return Response.json({ 
      success: true, 
      message: `Invitation sent to ${email}`,
      email,
      role: platformRole
    });
    
  } catch (error) {
    console.error('Invite user error:', error);
    
    // Check if user already exists
    const errorMsg = error.message || '';
    if (errorMsg.includes('already exists') || 
        errorMsg.includes('already invited') ||
        errorMsg.includes('already registered')) {
      return Response.json({ 
        error: 'משתמש עם אימייל זה כבר קיים במערכת',
        code: 'USER_EXISTS'
      }, { status: 409 });
    }
    
    return Response.json({ 
      error: error.message || 'Failed to invite user' 
    }, { status: 500 });
  }
});