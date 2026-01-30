import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Security Check
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.app_role !== 'super_admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { entityType, recordId } = await req.json();

        if (!entityType || !recordId) {
            return Response.json({ error: 'entityType and recordId required' }, { status: 400 });
        }

        // Delete from the appropriate entity
        switch (entityType) {
            case 'user':
                // Prevent self-deletion
                if (recordId === currentUser.id) {
                    return Response.json({ error: 'Cannot delete yourself' }, { status: 400 });
                }
                await base44.asServiceRole.entities.User.delete(recordId);
                break;
            case 'client':
                await base44.asServiceRole.entities.Client.delete(recordId);
                break;
            case 'contractor':
                await base44.asServiceRole.entities.Contractor.delete(recordId);
                break;
            case 'team_member':
                await base44.asServiceRole.entities.TeamMember.delete(recordId);
                break;
            case 'consultant':
                await base44.asServiceRole.entities.Consultant.delete(recordId);
                break;
            default:
                return Response.json({ error: 'Invalid entityType' }, { status: 400 });
        }

        return Response.json({ success: true, message: `${entityType} deleted successfully` });

    } catch (error) {
        console.error('Error in adminDeleteRecord:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});