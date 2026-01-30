// Get System Hierarchy Edge Function
// Returns the full system hierarchy for Super Admin dashboard

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get the current user from the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the user record to check app_role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single()

    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only super admin can access system hierarchy
    if (currentUser.app_role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all data
    const [
      { data: allUsers },
      { data: allClients },
      { data: allContractors },
      { data: allTeamMembers },
      { data: allConsultants }
    ] = await Promise.all([
      supabase.from('users').select('*').limit(1000),
      supabase.from('clients').select('*').limit(1000),
      supabase.from('contractors').select('*').limit(1000),
      supabase.from('team_members').select('*').limit(1000),
      supabase.from('consultants').select('*').limit(1000),
    ])

    // Build set of all registered emails
    const registeredEmails = new Set(
      (allUsers || []).map(u => u.email?.toLowerCase()).filter(Boolean)
    )

    // Find all Architects
    const architects = (allUsers || []).filter(u => 
      u.app_role === 'architect' || 
      (u.role === 'admin' && u.app_role !== 'super_admin' && u.email !== currentUser.email)
    )

    // Build hierarchy for each architect
    const hierarchy = architects.map(arch => {
      const archId = arch.id
      const archEmail = arch.email

      // Find entities by architect_id OR created_by
      const myClients = (allClients || []).filter(c => 
        c.architect_id === archId || 
        (!c.architect_id && c.created_by === archEmail)
      )
      const myContractors = (allContractors || []).filter(c => 
        c.architect_id === archId || 
        (!c.architect_id && c.created_by === archEmail)
      )
      const myTeam = (allTeamMembers || []).filter(t => 
        t.architect_id === archId || 
        (!t.architect_id && t.created_by === archEmail)
      )
      const myConsultants = (allConsultants || []).filter(c => 
        c.architect_id === archId || 
        (!c.architect_id && c.created_by === archEmail)
      )

      // Enrich each record with registration status
      const enrichRecord = (record: any, type: string) => ({
        ...record,
        entity_type: type,
        is_registered: registeredEmails.has(record.email?.toLowerCase()),
        approval_status: record.approval_status || 'pending'
      })

      return {
        architect: {
          ...arch,
          entity_type: 'architect',
          is_registered: true
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
      }
    })

    // Find unassigned users
    const architectEmails = new Set(architects.map(a => a.email.toLowerCase()))
    const entityEmails = new Set([
      ...(allClients || []).map(c => c.email?.toLowerCase()).filter(Boolean),
      ...(allContractors || []).map(c => c.email?.toLowerCase()).filter(Boolean),
      ...(allTeamMembers || []).map(t => t.email?.toLowerCase()).filter(Boolean),
      ...(allConsultants || []).map(c => c.email?.toLowerCase()).filter(Boolean)
    ])

    const assignedRoles = new Set(['super_admin', 'architect', 'client', 'contractor', 'consultant', 'team_member'])

    const unassignedUsers = (allUsers || []).filter(u => {
      if (!u.email) return false
      const emailLower = u.email.toLowerCase()
      if (u.app_role === 'super_admin') return false
      if (u.app_role === 'architect' || architectEmails.has(emailLower)) return false
      if (assignedRoles.has(u.app_role)) return false
      if (entityEmails.has(emailLower)) return false
      return true
    }).map(u => ({
      ...u,
      entity_type: 'user',
      is_registered: true
    }))

    // Find orphaned records
    const allAssignedClientIds = new Set(hierarchy.flatMap(h => h.clients.map(c => c.id)))
    const allAssignedContractorIds = new Set(hierarchy.flatMap(h => h.contractors.map(c => c.id)))
    const allAssignedTeamIds = new Set(hierarchy.flatMap(h => h.team_members.map(t => t.id)))
    const allAssignedConsultantIds = new Set(hierarchy.flatMap(h => h.consultants.map(c => c.id)))

    const orphanedClients = (allClients || [])
      .filter(c => !allAssignedClientIds.has(c.id))
      .map(c => ({ 
        ...c, 
        entity_type: 'client', 
        is_registered: registeredEmails.has(c.email?.toLowerCase()), 
        approval_status: c.approval_status || 'pending' 
      }))

    const orphanedContractors = (allContractors || [])
      .filter(c => !allAssignedContractorIds.has(c.id))
      .map(c => ({ 
        ...c, 
        entity_type: 'contractor', 
        is_registered: registeredEmails.has(c.email?.toLowerCase()), 
        approval_status: c.approval_status || 'pending' 
      }))

    const orphanedTeam = (allTeamMembers || [])
      .filter(t => !allAssignedTeamIds.has(t.id))
      .map(t => ({ 
        ...t, 
        entity_type: 'team_member', 
        is_registered: registeredEmails.has(t.email?.toLowerCase()), 
        approval_status: t.approval_status || 'pending' 
      }))

    const orphanedConsultants = (allConsultants || [])
      .filter(c => !allAssignedConsultantIds.has(c.id))
      .map(c => ({ 
        ...c, 
        entity_type: 'consultant', 
        is_registered: registeredEmails.has(c.email?.toLowerCase()), 
        approval_status: c.approval_status || 'pending' 
      }))

    return new Response(
      JSON.stringify({ 
        hierarchy, 
        unassigned_users: unassignedUsers,
        orphaned_records: {
          clients: orphanedClients,
          contractors: orphanedContractors,
          team_members: orphanedTeam,
          consultants: orphanedConsultants
        },
        totals: {
          users: (allUsers || []).length,
          architects: architects.length,
          clients: (allClients || []).length,
          contractors: (allContractors || []).length,
          team_members: (allTeamMembers || []).length,
          consultants: (allConsultants || []).length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in getSystemHierarchy:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
