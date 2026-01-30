import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Parse parameters from JSON body (SDK invoke) or URL (direct call)
    let body = {};
    try {
        const text = await req.text();
        if (text) body = JSON.parse(text);
    } catch (e) {
        // Ignore JSON parse error if body is empty
    }
    
    const url = new URL(req.url);
    const projectId = body.id || url.searchParams.get('id');
    const type = body.type || url.searchParams.get('type') || 'proposal';

    if (!projectId) {
      return Response.json(
        { error: 'Missing project ID' }, 
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Create client from request - AUTOMATICALLY handles service role if configured correctly in platform
    // This uses the internal service token provided to the function environment
    const base44 = createClientFromRequest(req);

    // Fetch project using service role (bypassing RLS)
    const projects = await base44.asServiceRole.entities.Project.filter({ id: projectId });
    const project = projects[0];

    if (!project) {
      return Response.json(
        { error: 'Project not found' }, 
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Prepare response data
    let proposal = null;
    let template = null;
    let documents = [];

    // Fetch proposal if type is proposal
    if (type === 'proposal') {
      const proposals = await base44.asServiceRole.entities.Proposal.filter(
        { project_id: String(project.id) }, 
        '-created_date', 
        1
      );
      proposal = proposals[0];

      // Fetch template if proposal has one
      if (proposal?.template_id) {
        const templates = await base44.asServiceRole.entities.ProposalTemplate.filter(
          { id: proposal.template_id }
        );
        template = templates[0];
      }
    }

    // Fetch documents based on type
    const categoryMap = {
      sketches: 'plan',
      renderings: 'rendering',
      technical: 'specification',
      proposal: 'proposal'
    };

    const category = categoryMap[type] || 'other';
    
    try {
      documents = await base44.asServiceRole.entities.Document.filter({
        project_id: String(project.id),
        category: category
      });
    } catch (docError) {
      console.log('No documents found or error fetching documents:', docError);
      documents = [];
    }

    // Return sanitized data
    const sanitizedProject = {
      id: project.id,
      name: project.name,
      client_id: project.client_id,
      status: project.status,
      client: project.client,
      client_email: project.client_email,
      client_phone: project.client_phone,
      location: project.location
    };

    return Response.json({
      success: true,
      project: sanitizedProject,
      proposal,
      template,
      documents
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error in getPublicProposal:', error);
    return Response.json(
      { error: error.message, success: false }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
});