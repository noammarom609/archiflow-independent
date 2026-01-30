import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const currentUser = await base44.auth.me();
        
        if (!currentUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Must be architect or super_admin
        const isArchitect = currentUser.app_role === 'architect' || currentUser.role === 'admin';
        const isSuperAdmin = currentUser.app_role === 'super_admin';
        
        if (!isArchitect && !isSuperAdmin) {
            return Response.json({ error: 'Access denied' }, { status: 403 });
        }

        let myClients = [];
        let myContractors = [];
        let myTeamMembers = [];
        let myConsultants = [];
        let allUsers = [];

        if (isSuperAdmin) {
            // Super Admin sees everything
            const [clients, contractors, teamMembers, consultants, users] = await Promise.all([
                base44.asServiceRole.entities.Client.list(null, 1000),
                base44.asServiceRole.entities.Contractor.list(null, 1000),
                base44.asServiceRole.entities.TeamMember.list(null, 1000),
                base44.asServiceRole.entities.Consultant.list(null, 1000),
                base44.asServiceRole.entities.User.list(null, 1000)
            ]);
            myClients = clients || [];
            myContractors = contractors || [];
            myTeamMembers = teamMembers || [];
            myConsultants = consultants || [];
            allUsers = users || [];
        } else {
            // Architect sees records associated with them through multiple fields
            const userEmail = currentUser.email?.toLowerCase();
            const userId = currentUser.id;
            
            // Fetch all records and filter by multiple association fields
            const [allClients, allContractors, allTeamMembers, allConsultants, users] = await Promise.all([
                base44.asServiceRole.entities.Client.list(null, 1000),
                base44.asServiceRole.entities.Contractor.list(null, 1000),
                base44.asServiceRole.entities.TeamMember.list(null, 1000),
                base44.asServiceRole.entities.Consultant.list(null, 1000),
                base44.asServiceRole.entities.User.list(null, 1000)
            ]);
            
            // Filter clients by multiple association fields
            myClients = (allClients || []).filter(record => {
                return (
                    record.created_by?.toLowerCase() === userEmail ||
                    record.architect_id === userId ||
                    record.architect_email?.toLowerCase() === userEmail ||
                    record.approved_by?.toLowerCase() === userEmail
                );
            });
            
            // Filter contractors by multiple association fields
            myContractors = (allContractors || []).filter(record => {
                return (
                    record.created_by?.toLowerCase() === userEmail ||
                    record.architect_id === userId ||
                    record.architect_email?.toLowerCase() === userEmail ||
                    record.owner_email?.toLowerCase() === userEmail ||
                    record.assigned_architect?.toLowerCase() === userEmail ||
                    record.approved_by?.toLowerCase() === userEmail
                );
            });
            
            // Filter team members by multiple association fields
            myTeamMembers = (allTeamMembers || []).filter(record => {
                return (
                    record.created_by?.toLowerCase() === userEmail ||
                    record.architect_id === userId ||
                    record.architect_email?.toLowerCase() === userEmail ||
                    record.approved_by?.toLowerCase() === userEmail
                );
            });
            
            // Filter consultants by multiple association fields
            myConsultants = (allConsultants || []).filter(record => {
                return (
                    record.created_by?.toLowerCase() === userEmail ||
                    record.architect_id === userId ||
                    record.architect_email?.toLowerCase() === userEmail ||
                    record.approved_by?.toLowerCase() === userEmail
                );
            });
            
            allUsers = users || [];
        }

        // Build set of registered emails
        const registeredEmails = new Set(allUsers.map(u => u.email?.toLowerCase()).filter(Boolean));

        // Enrich records with registration and approval status
        const enrichRecord = (record, type) => ({
            ...record,
            entity_type: type,
            is_registered: registeredEmails.has(record.email?.toLowerCase()),
            approval_status: record.approval_status || 'pending'
        });

        const clients = myClients.map(c => enrichRecord(c, 'client'));
        const contractors = myContractors.map(c => enrichRecord(c, 'contractor'));
        const team_members = myTeamMembers.map(t => enrichRecord(t, 'team_member'));
        const consultants = myConsultants.map(c => enrichRecord(c, 'consultant'));

        // Calculate stats
        const allRecords = [...clients, ...contractors, ...team_members, ...consultants];
        const pendingCount = allRecords.filter(r => r.approval_status === 'pending').length;
        const approvedCount = allRecords.filter(r => r.approval_status === 'approved').length;
        const rejectedCount = allRecords.filter(r => r.approval_status === 'rejected').length;

        return Response.json({
            clients,
            contractors,
            team_members,
            consultants,
            stats: {
                total: allRecords.length,
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
                clients: clients.length,
                contractors: contractors.filter(c => c.type === 'contractor').length,
                suppliers: contractors.filter(c => c.type === 'supplier').length,
                team_members: team_members.length,
                consultants: consultants.length
            }
        });

    } catch (error) {
        console.error('Error in getArchitectUsers:', error);
        // Return empty data structure instead of error for better UX
        return Response.json({
            clients: [],
            contractors: [],
            team_members: [],
            consultants: [],
            stats: {
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                clients: 0,
                contractors: 0,
                suppliers: 0,
                team_members: 0,
                consultants: 0
            }
        });
    }
});