import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automation handler for Recording entity changes
 * Triggers notifications when recordings are analyzed
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (!data) {
      return Response.json({ success: true, message: 'No data provided' });
    }

    const recordingTitle = data.title || 'הקלטה';
    const recordingId = event.entity_id;

    if (event.type === 'update' && old_data) {
      // Check if analysis completed
      if (data.status === 'analyzed' && old_data.status !== 'analyzed') {
        // Notify recording creator
        if (data.created_by) {
          await base44.asServiceRole.functions.invoke('createNotification', {
            user_email: data.created_by,
            title: 'ניתוח הקלטה הושלם',
            message: `הניתוח של "${recordingTitle}" הושלם בהצלחה`,
            type: 'recording_analyzed',
            priority: 'normal',
            link: 'Recordings',
            entity_type: 'Recording',
            entity_id: recordingId,
            metadata: { 
              recording_title: recordingTitle,
              project_name: data.project_name
            }
          });
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onRecordingChange:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});