import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Security Check
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.app_role !== 'super_admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { 
            action,           // 'make_architect' | 'assign_to_architect' | 'delete'
            userId,           // User ID to act upon
            targetArchitectId, // For 'assign_to_architect' action
            assignAs          // 'client' | 'contractor' | 'supplier' | 'team_member'
        } = await req.json();

        if (!userId) {
            return Response.json({ error: 'User ID required' }, { status: 400 });
        }

        // Prevent self-modification for delete
        if (action === 'delete' && userId === currentUser.id) {
            return Response.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        // Get the user
        const users = await base44.asServiceRole.entities.User.list();
        const targetUser = users.find(u => u.id === userId);
        
        if (!targetUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // ACTION: Make Architect
        if (action === 'make_architect') {
            await base44.asServiceRole.entities.User.update(userId, {
                app_role: 'architect',
                status: 'active'
            });
            return Response.json({ success: true, message: 'User promoted to architect' });
        }

        // ACTION: Assign to Architect
        if (action === 'assign_to_architect') {
            if (!targetArchitectId || !assignAs) {
                return Response.json({ error: 'Missing targetArchitectId or assignAs' }, { status: 400 });
            }

            // Verify architect exists
            const architect = users.find(u => u.id === targetArchitectId && u.app_role === 'architect');
            if (!architect) {
                return Response.json({ error: 'Architect not found' }, { status: 404 });
            }

            // Create the appropriate entity record linked to the architect
            const baseData = {
                architect_id: targetArchitectId,
                email: targetUser.email,
                avatar_url: targetUser.avatar_url
            };

            if (assignAs === 'client') {
                await base44.asServiceRole.entities.Client.create({
                    ...baseData,
                    full_name: targetUser.full_name || targetUser.email,
                    phone: targetUser.phone || '',
                    status: 'active'
                });
                // Update user's app_role
                await base44.asServiceRole.entities.User.update(userId, { app_role: 'client' });
            } 
            else if (assignAs === 'contractor' || assignAs === 'supplier') {
                await base44.asServiceRole.entities.Contractor.create({
                    ...baseData,
                    name: targetUser.full_name || targetUser.email,
                    phone: targetUser.phone || '',
                    type: assignAs,
                    specialty: 'other',
                    status: 'active'
                });
                await base44.asServiceRole.entities.User.update(userId, { app_role: 'contractor' });
            }
            else if (assignAs === 'team_member') {
                await base44.asServiceRole.entities.TeamMember.create({
                    ...baseData,
                    full_name: targetUser.full_name || targetUser.email,
                    role: 'designer',
                    status: 'active'
                });
                await base44.asServiceRole.entities.User.update(userId, { app_role: 'team_member' });
            }
            else if (assignAs === 'consultant') {
                await base44.asServiceRole.entities.Consultant.create({
                    ...baseData,
                    name: targetUser.full_name || targetUser.email,
                    phone: targetUser.phone || '',
                    consultant_type: 'other',
                    status: 'active'
                });
                await base44.asServiceRole.entities.User.update(userId, { app_role: 'consultant' });
            }

            return Response.json({ success: true, message: `User assigned to architect as ${assignAs}` });
        }

        // ACTION: Delete
        if (action === 'delete') {
            await base44.asServiceRole.entities.User.delete(userId);
            return Response.json({ success: true, message: 'User deleted' });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error in adminAssignUser:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});