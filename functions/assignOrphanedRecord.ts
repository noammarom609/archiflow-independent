import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const currentUser = await base44.auth.me();
        
        if (!currentUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only super admin can assign orphaned records
        if (currentUser.app_role !== 'super_admin') {
            return Response.json({ error: 'Only Super Admin can assign records' }, { status: 403 });
        }

        const { entityType, recordId, targetArchitectId } = await req.json();
        
        if (!entityType || !recordId || !targetArchitectId) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify architect exists
        const architects = await base44.asServiceRole.entities.User.filter({ id: targetArchitectId });
        const architect = architects[0];
        
        if (!architect) {
            return Response.json({ error: 'Architect not found' }, { status: 404 });
        }

        // Update the record with architect_id
        let entityClass;
        
        switch(entityType) {
            case 'client':
                entityClass = base44.asServiceRole.entities.Client;
                break;
            case 'contractor':
                entityClass = base44.asServiceRole.entities.Contractor;
                break;
            case 'team_member':
                entityClass = base44.asServiceRole.entities.TeamMember;
                break;
            case 'consultant':
                entityClass = base44.asServiceRole.entities.Consultant;
                break;
            default:
                return Response.json({ error: 'Invalid entity type' }, { status: 400 });
        }

        await entityClass.update(recordId, { 
            architect_id: targetArchitectId 
        });

        return Response.json({ 
            success: true, 
            message: 'Record assigned successfully',
            recordId,
            architectId: targetArchitectId
        });

    } catch (error) {
        console.error('Error in assignOrphanedRecord:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});