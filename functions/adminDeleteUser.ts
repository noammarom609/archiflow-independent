import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Security Check
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.app_role !== 'super_admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId } = await req.json();
        if (!userId) {
            return Response.json({ error: 'User ID required' }, { status: 400 });
        }

        // Prevent self-deletion
        if (userId === currentUser.id) {
            return Response.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        // 2. Delete the user
        await base44.asServiceRole.entities.User.delete(userId);

        return Response.json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});