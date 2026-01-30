import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const currentUser = await base44.auth.me();
        
        if (!currentUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { entityType, recordId, action, rejectionReason } = await req.json();
        
        if (!entityType || !recordId || !action) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate action
        if (!['approve', 'reject'].includes(action)) {
            return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Determine if user has permission to approve
        // Roles that can approve: super_admin, admin, architect, project_manager
        const isSuperAdmin = currentUser.app_role === 'super_admin';
        const isAdmin = currentUser.role === 'admin' || currentUser.app_role === 'admin';
        const isArchitect = currentUser.app_role === 'architect';
        const isProjectManager = currentUser.app_role === 'project_manager';
        
        const canApprove = isSuperAdmin || isAdmin || isArchitect || isProjectManager;

        if (!canApprove) {
            return Response.json({ error: 'No permission to approve' }, { status: 403 });
        }

        // Get the entity
        let entity;
        let entityClass;
        
        switch(entityType) {
            case 'user':
                entityClass = base44.asServiceRole.entities.User;
                entity = (await entityClass.filter({ id: recordId }))[0];
                break;
            case 'client':
                entityClass = base44.asServiceRole.entities.Client;
                entity = (await entityClass.filter({ id: recordId }))[0];
                break;
            case 'contractor':
                entityClass = base44.asServiceRole.entities.Contractor;
                entity = (await entityClass.filter({ id: recordId }))[0];
                break;
            case 'team_member':
                entityClass = base44.asServiceRole.entities.TeamMember;
                entity = (await entityClass.filter({ id: recordId }))[0];
                break;
            case 'consultant':
                entityClass = base44.asServiceRole.entities.Consultant;
                entity = (await entityClass.filter({ id: recordId }))[0];
                break;
            default:
                return Response.json({ error: 'Invalid entity type' }, { status: 400 });
        }

        if (!entity) {
            return Response.json({ error: 'Record not found' }, { status: 404 });
        }

        // Super admin and platform admin can approve anything
        // Others must verify they own this record
        if (!isSuperAdmin && !isAdmin) {
            const isOwner = entity.architect_id === currentUser.id || 
                           entity.created_by === currentUser.email ||
                           entity.architect_email?.toLowerCase() === currentUser.email?.toLowerCase();
            if (!isOwner) {
                return Response.json({ error: 'No permission to approve this record' }, { status: 403 });
            }
        }

        // Update the record
        const updateData = {
            approval_status: action === 'approve' ? 'approved' : 'rejected',
            approved_by: currentUser.id,
            approved_date: new Date().toISOString(),
        };

        if (action === 'reject' && rejectionReason) {
            updateData.rejection_reason = rejectionReason;
        }

        // For users, also update status
        if (entityType === 'user') {
            updateData.status = action === 'approve' ? 'active' : 'inactive';
        }

        await entityClass.update(recordId, updateData);

        return Response.json({ 
            success: true, 
            message: action === 'approve' ? 'Record approved successfully' : 'Record rejected',
            recordId 
        });

    } catch (error) {
        console.error('Error in approveRecord:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});