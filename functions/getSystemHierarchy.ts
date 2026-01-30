import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Security Check: Only Super Admin
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.app_role !== 'super_admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 2. Fetch ALL Users (Login accounts)
        const allUsers = await base44.asServiceRole.entities.User.list(null, 1000);

        // 3. Fetch ALL Entities (regardless of who created them)
        const allClients = await base44.asServiceRole.entities.Client.list(null, 1000);
        const allContractors = await base44.asServiceRole.entities.Contractor.list(null, 1000);
        const allTeamMembers = await base44.asServiceRole.entities.TeamMember.list(null, 1000);
        const allConsultants = await base44.asServiceRole.entities.Consultant.list(null, 1000);

        // 4. Build set of all registered emails (users with login)
        const registeredEmails = new Set(allUsers.map(u => u.email?.toLowerCase()).filter(Boolean));
        
        // 5. Find all Architects (app_role = 'architect' OR legacy users with role='admin' who are not super_admin)
        const architects = allUsers.filter(u => 
            u.app_role === 'architect' || 
            (u.role === 'admin' && u.app_role !== 'super_admin' && u.email !== currentUser.email)
        );
        
        // 6. Build hierarchy for each architect
        const hierarchy = architects.map(arch => {
            const archId = arch.id;
            const archEmail = arch.email;

            // Find entities by architect_id OR created_by (fallback for unmigrated data)
            const myClients = allClients.filter(c => 
                c.architect_id === archId || 
                (!c.architect_id && c.created_by === archEmail)
            );
            const myContractors = allContractors.filter(c => 
                c.architect_id === archId || 
                (!c.architect_id && c.created_by === archEmail)
            );
            const myTeam = allTeamMembers.filter(t => 
                t.architect_id === archId || 
                (!t.architect_id && t.created_by === archEmail)
            );
            const myConsultants = allConsultants.filter(c => 
                c.architect_id === archId || 
                (!c.architect_id && c.created_by === archEmail)
            );

            // Enrich each record with registration status
            const enrichRecord = (record, type) => ({
                ...record,
                entity_type: type,
                is_registered: registeredEmails.has(record.email?.toLowerCase()),
                approval_status: record.approval_status || 'pending'
            });

            return {
                architect: {
                    ...arch,
                    entity_type: 'architect',
                    is_registered: true // architects are always registered
                },
                stats: {
                    clients: myClients.length,
                    contractors: myContractors.filter(c => c.type === 'contractor').length,
                    suppliers: myContractors.filter(c => c.type === 'supplier').length,
                    team_members: myTeam.length,
                    consultants: myConsultants.length,
                    registered_users: [
                        ...myClients.filter(c => registeredEmails.has(c.email?.toLowerCase())),
                        ...myContractors.filter(c => registeredEmails.has(c.email?.toLowerCase())),
                        ...myTeam.filter(t => registeredEmails.has(t.email?.toLowerCase())),
                        ...myConsultants.filter(c => registeredEmails.has(c.email?.toLowerCase()))
                    ].length
                },
                clients: myClients.map(c => enrichRecord(c, 'client')),
                contractors: myContractors.map(c => enrichRecord(c, 'contractor')),
                team_members: myTeam.map(t => enrichRecord(t, 'team_member')),
                consultants: myConsultants.map(c => enrichRecord(c, 'consultant'))
            };
        });

        // 7. Find Unassigned Users (have login but not architect, and not assigned)
        // A user is considered "assigned" if:
        // - They are the current super_admin
        // - They are an architect
        // - They have an app_role that indicates assignment (client, contractor, consultant, team_member)
        // - Their email exists in any entity record (Client, Contractor, TeamMember, Consultant)
        
        const architectEmails = new Set(architects.map(a => a.email.toLowerCase()));
        
        // Collect all emails from entity records (these users are assigned to architects)
        const entityEmails = new Set([
            ...allClients.map(c => c.email?.toLowerCase()).filter(Boolean),
            ...allContractors.map(c => c.email?.toLowerCase()).filter(Boolean),
            ...allTeamMembers.map(t => t.email?.toLowerCase()).filter(Boolean),
            ...allConsultants.map(c => c.email?.toLowerCase()).filter(Boolean)
        ]);
        
        // Roles that indicate the user is assigned
        const assignedRoles = new Set(['super_admin', 'architect', 'client', 'contractor', 'consultant', 'team_member']);
        
        const unassignedUsers = allUsers.filter(u => {
            if (!u.email) return false;
            const emailLower = u.email.toLowerCase();
            
            // Exclude super_admin
            if (u.app_role === 'super_admin') return false;
            
            // Exclude architects
            if (u.app_role === 'architect' || architectEmails.has(emailLower)) return false;
            
            // Exclude users with assigned roles
            if (assignedRoles.has(u.app_role)) return false;
            
            // Exclude users whose email exists in any entity record
            if (entityEmails.has(emailLower)) return false;
            
            return true;
        }).map(u => ({
            ...u,
            entity_type: 'user',
            is_registered: true
        }));

        // 8. Find orphaned entity records (not assigned to any architect)
        const allAssignedClientIds = new Set(hierarchy.flatMap(h => h.clients.map(c => c.id)));
        const allAssignedContractorIds = new Set(hierarchy.flatMap(h => h.contractors.map(c => c.id)));
        const allAssignedTeamIds = new Set(hierarchy.flatMap(h => h.team_members.map(t => t.id)));
        const allAssignedConsultantIds = new Set(hierarchy.flatMap(h => h.consultants.map(c => c.id)));

        const orphanedClients = allClients
            .filter(c => !allAssignedClientIds.has(c.id))
            .map(c => ({ ...c, entity_type: 'client', is_registered: registeredEmails.has(c.email?.toLowerCase()), approval_status: c.approval_status || 'pending' }));
        
        const orphanedContractors = allContractors
            .filter(c => !allAssignedContractorIds.has(c.id))
            .map(c => ({ ...c, entity_type: 'contractor', is_registered: registeredEmails.has(c.email?.toLowerCase()), approval_status: c.approval_status || 'pending' }));
        
        const orphanedTeam = allTeamMembers
            .filter(t => !allAssignedTeamIds.has(t.id))
            .map(t => ({ ...t, entity_type: 'team_member', is_registered: registeredEmails.has(t.email?.toLowerCase()), approval_status: t.approval_status || 'pending' }));

        const orphanedConsultants = allConsultants
            .filter(c => !allAssignedConsultantIds.has(c.id))
            .map(c => ({ ...c, entity_type: 'consultant', is_registered: registeredEmails.has(c.email?.toLowerCase()), approval_status: c.approval_status || 'pending' }));

        return Response.json({ 
            hierarchy, 
            unassigned_users: unassignedUsers,
            orphaned_records: {
                clients: orphanedClients,
                contractors: orphanedContractors,
                team_members: orphanedTeam,
                consultants: orphanedConsultants
            },
            totals: {
                users: allUsers.length,
                architects: architects.length,
                clients: allClients.length,
                contractors: allContractors.length,
                team_members: allTeamMembers.length,
                consultants: allConsultants.length
            }
        });

    } catch (error) {
        console.error('Error in getSystemHierarchy:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});