import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ADMIN_PIN = "2189";

Deno.serve(async (req) => {
    try {
        const { pin, action } = await req.json();
        
        // Action to verify bypass token
        if (action === 'verify') {
            const token = req.headers.get('x-bypass-token');
            if (token && token.startsWith('admin_bypass_')) {
                return Response.json({ valid: true });
            }
            return Response.json({ valid: false });
        }
        
        if (pin !== ADMIN_PIN) {
            return Response.json({ error: 'Invalid PIN' }, { status: 401 });
        }

        // PIN is correct - return success with bypass token
        const bypassToken = `admin_bypass_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        return Response.json({ 
            success: true, 
            bypassToken,
            // Return a mock super admin user object
            user: {
                id: 'super_admin_bypass',
                email: 'admin@archiflow.io',
                full_name: 'Super Admin',
                role: 'admin',
                app_role: 'super_admin',
                approval_status: 'approved'
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});