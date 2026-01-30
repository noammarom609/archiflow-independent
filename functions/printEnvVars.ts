import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only allow admins to view these sensitive values
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const appId = Deno.env.get('BASE44_APP_ID');
    const appBaseUrl = Deno.env.get('BASE44_APP_BASE_URL');

    console.log('=== Environment Variables ===');
    console.log('BASE44_APP_ID:', appId);
    console.log('BASE44_APP_BASE_URL:', appBaseUrl);
    console.log('============================');

    return Response.json({
      message: 'Environment variables logged to console',
      appId: appId,
      appBaseUrl: appBaseUrl
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});