import { base44 } from '@/api/base44Client';

/**
 * Add an event to client's timeline history
 */
export async function addClientHistoryEvent(clientId, event) {
  if (!clientId) return;

  try {
    // Get current client
    const clients = await base44.entities.Client.filter({ id: clientId });
    if (clients.length === 0) return;

    const client = clients[0];
    const currentTimeline = client.timeline || [];

    // Add new event with timestamp
    const newEvent = {
      ...event,
      date: event.date || new Date().toISOString(),
    };

    // Update client with new timeline
    await base44.entities.Client.update(clientId, {
      timeline: [...currentTimeline, newEvent],
      last_contact_date: new Date().toISOString().split('T')[0],
    });

    return true;
  } catch (error) {
    console.error('Error adding client history event:', error);
    return false;
  }
}

/**
 * Add recording to client history
 */
export async function addRecordingToClientHistory(clientId, recording, project) {
  if (!clientId) return;

  try {
    const clients = await base44.entities.Client.filter({ id: clientId });
    if (clients.length === 0) return;

    const client = clients[0];
    const currentRecordings = client.recordings || [];
    const currentTimeline = client.timeline || [];

    const projectName = project?.name || 'פרויקט חדש';
    const recordingTitle = recording?.title || 'הקלטה';

    // Add recording reference
    const newRecording = {
      recording_id: recording?.id || '',
      type: recordingTitle.includes('טלפון') ? 'phone_call' : 'first_meeting',
      title: recordingTitle,
      date: new Date().toISOString(),
      project_id: project?.id || '',
      summary: recording?.analysis?.summary || recording?.analysis?.executive_summary || '',
    };

    // Add timeline event
    const timelineEvent = {
      date: new Date().toISOString(),
      type: newRecording.type,
      title: recordingTitle,
      description: newRecording.summary,
      project_id: project?.id || '',
      project_name: projectName,
      stage: 'first_call',
      data: { recording_id: recording?.id || '' },
    };

    await base44.entities.Client.update(clientId, {
      recordings: [...currentRecordings, newRecording],
      timeline: [...currentTimeline, timelineEvent],
      last_contact_date: new Date().toISOString().split('T')[0],
    });

    return true;
  } catch (error) {
    console.error('Error adding recording to client history:', error);
    return false;
  }
}

/**
 * Add meeting to client history
 */
export async function addMeetingToClientHistory(clientId, meetingData, project) {
  if (!clientId) return;

  try {
    const clients = await base44.entities.Client.filter({ id: clientId });
    if (clients.length === 0) return;

    const client = clients[0];
    const currentMeetings = client.meetings || [];
    const currentTimeline = client.timeline || [];

    const projectName = project?.name || 'פרויקט חדש';

    // Add meeting
    const newMeeting = {
      date: new Date().toISOString(),
      type: 'first_meeting',
      project_id: project?.id || '',
      notes: meetingData?.notes || '',
      checklist: meetingData?.checklist || [],
      ai_summary: meetingData?.analysis || {},
    };

    // Add timeline event
    const timelineEvent = {
      date: new Date().toISOString(),
      type: 'first_meeting',
      title: `פגישה ראשונה - ${projectName}`,
      description: meetingData?.analysis?.executive_summary || 'פגישה פרונטלית עם הלקוח',
      project_id: project?.id || '',
      project_name: projectName,
      stage: 'first_call',
      data: { checklist_completed: meetingData?.checklist?.filter(c => c.checked)?.length || 0 },
    };

    await base44.entities.Client.update(clientId, {
      meetings: [...currentMeetings, newMeeting],
      timeline: [...currentTimeline, timelineEvent],
      last_contact_date: new Date().toISOString().split('T')[0],
    });

    return true;
  } catch (error) {
    console.error('Error adding meeting to client history:', error);
    return false;
  }
}

/**
 * Add proposal to client history
 */
export async function addProposalToClientHistory(clientId, proposal, project) {
  if (!clientId) return;

  try {
    const clients = await base44.entities.Client.filter({ id: clientId });
    if (clients.length === 0) return;

    const client = clients[0];
    const currentProposals = client.proposals || [];
    const currentTimeline = client.timeline || [];

    const projectName = project?.name || 'פרויקט';
    const proposalTitle = proposal?.title || 'הצעת מחיר';

    // Add proposal reference
    const newProposal = {
      proposal_id: proposal?.id || '',
      project_id: project?.id || '',
      date: new Date().toISOString(),
      amount: proposal?.total_amount || 0,
      status: proposal?.status || 'draft',
    };

    // Add timeline event
    const timelineEvent = {
      date: new Date().toISOString(),
      type: 'proposal',
      title: `הצעת מחיר - ${proposalTitle}`,
      description: `סכום: ₪${(proposal?.total_amount || 0).toLocaleString()} | סטטוס: ${proposal?.status || 'טיוטה'}`,
      project_id: project?.id || '',
      project_name: projectName,
      stage: 'proposal',
      data: { proposal_id: proposal?.id || '', amount: proposal?.total_amount || 0 },
    };

    await base44.entities.Client.update(clientId, {
      proposals: [...currentProposals, newProposal],
      timeline: [...currentTimeline, timelineEvent],
      last_contact_date: new Date().toISOString().split('T')[0],
    });

    return true;
  } catch (error) {
    console.error('Error adding proposal to client history:', error);
    return false;
  }
}

/**
 * Add signature event to client history
 */
export async function addSignatureToClientHistory(clientId, signatureData, project) {
  if (!clientId) return;

  try {
    const clients = await base44.entities.Client.filter({ id: clientId });
    if (clients.length === 0) return;

    const client = clients[0];
    const currentTimeline = client.timeline || [];

    const projectName = project?.name || 'פרויקט';

    // Add timeline event
    const timelineEvent = {
      date: new Date().toISOString(),
      type: 'signature',
      title: `חתימה דיגיטלית - ${signatureData.document_title}`,
      description: `המסמך נחתם בהצלחה על ידי ${signatureData.signer_name}`,
      project_id: project?.id || '',
      project_name: projectName,
      stage: signatureData.stage || 'general',
      data: {
        signature_id: signatureData.id,
        document_type: signatureData.document_type,
        signer_name: signatureData.signer_name,
        timestamp: signatureData.timestamp,
        ip_address: signatureData.ip_address
      },
    };

    await base44.entities.Client.update(clientId, {
      timeline: [...currentTimeline, timelineEvent],
      last_contact_date: new Date().toISOString().split('T')[0],
    });

    return true;
  } catch (error) {
    console.error('Error adding signature to client history:', error);
    return false;
  }
}

/**
 * Add document to client history
 */
export async function addDocumentToClientHistory(clientId, document, project, signed = false) {
  if (!clientId) return;

  try {
    const clients = await base44.entities.Client.filter({ id: clientId });
    if (clients.length === 0) return;

    const client = clients[0];
    const currentDocuments = client.documents || [];
    const currentTimeline = client.timeline || [];

    // Add document reference
    const newDocument = {
      document_id: document.id,
      type: document.category || document.type,
      title: document.title,
      date: new Date().toISOString(),
      project_id: project?.id,
      signed,
    };

    // Add timeline event
    const timelineEvent = {
      date: new Date().toISOString(),
      type: signed ? 'signature' : 'document',
      title: signed ? `חתימה על ${document.title}` : document.title,
      description: signed ? 'הלקוח חתם על המסמך' : 'מסמך נשלח ללקוח',
      project_id: project?.id,
      project_name: project?.name,
      stage: document.category,
      data: { document_id: document.id },
    };

    await base44.entities.Client.update(clientId, {
      documents: [...currentDocuments, newDocument],
      timeline: [...currentTimeline, timelineEvent],
      last_contact_date: new Date().toISOString().split('T')[0],
    });

    return true;
  } catch (error) {
    console.error('Error adding document to client history:', error);
    return false;
  }
}

/**
 * Add stage change to client history
 */
export async function addStageChangeToClientHistory(clientId, stage, project) {
  if (!clientId) return;

  const stageLabels = {
    first_call: 'שיחה ראשונה',
    proposal: 'הצעת מחיר',
    gantt: 'יצירת גנט',
    sketches: 'סקיצות',
    rendering: 'הדמיות',
    technical: 'תוכניות עבודה',
    execution: 'ביצוע',
    completion: 'סיום',
  };

  try {
    const clients = await base44.entities.Client.filter({ id: clientId });
    if (clients.length === 0) return;

    const client = clients[0];
    const currentTimeline = client.timeline || [];

    const projectName = project?.name || 'פרויקט';
    const stageLabel = stageLabels[stage] || stage;

    // Add timeline event
    const timelineEvent = {
      date: new Date().toISOString(),
      type: stage,
      title: `מעבר לשלב: ${stageLabel}`,
      description: `הפרויקט התקדם לשלב ${stageLabel}`,
      project_id: project?.id || '',
      project_name: projectName,
      stage,
    };

    await base44.entities.Client.update(clientId, {
      timeline: [...currentTimeline, timelineEvent],
      last_contact_date: new Date().toISOString().split('T')[0],
    });

    return true;
  } catch (error) {
    console.error('Error adding stage change to client history:', error);
    return false;
  }
}

/**
 * Add payment to client history
 */
export async function addPaymentToClientHistory(clientId, paymentData, project) {
  if (!clientId) return;

  try {
    const clients = await base44.entities.Client.filter({ id: clientId });
    if (clients.length === 0) return;

    const client = clients[0];
    const currentPayments = client.payments || [];
    const currentTimeline = client.timeline || [];

    const projectName = project?.name || 'פרויקט';

    // Add payment record
    const newPayment = {
      date: new Date().toISOString(),
      amount: paymentData.amount,
      project_id: project?.id || '',
      description: paymentData.description || 'תשלום',
      status: paymentData.status || 'completed',
    };

    // Add timeline event
    const timelineEvent = {
      date: new Date().toISOString(),
      type: 'payment',
      title: `תשלום התקבל - ₪${paymentData.amount?.toLocaleString()}`,
      description: paymentData.description || 'תשלום התקבל בהצלחה',
      project_id: project?.id || '',
      project_name: projectName,
      stage: 'payment',
      data: { amount: paymentData.amount, payment_id: paymentData.id },
    };

    // Update total revenue
    const totalRevenue = (client.total_revenue || 0) + (paymentData.amount || 0);

    await base44.entities.Client.update(clientId, {
      payments: [...currentPayments, newPayment],
      timeline: [...currentTimeline, timelineEvent],
      total_revenue: totalRevenue,
      last_contact_date: new Date().toISOString().split('T')[0],
    });

    return true;
  } catch (error) {
    console.error('Error adding payment to client history:', error);
    return false;
  }
}

/**
 * Sync client contact info to all related projects
 */
export async function syncClientToProjects(clientId, clientData) {
  if (!clientId) return;

  try {
    // Find all projects for this client
    const projects = await base44.entities.Project.filter({ client_id: clientId });
    
    // Update each project with the latest client info
    const updates = projects.map(project => 
      base44.entities.Project.update(project.id, {
        client: clientData.full_name,
        client_email: clientData.email,
        client_phone: clientData.phone,
      })
    );

    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error('Error syncing client to projects:', error);
    return false;
  }
}

/**
 * Update client status based on active projects
 */
export async function updateClientStatusFromProjects(clientId) {
  if (!clientId) return;

  try {
    const projects = await base44.entities.Project.filter({ client_id: clientId });
    const clients = await base44.entities.Client.filter({ id: clientId });
    if (clients.length === 0) return;

    // Determine status based on projects
    let newStatus = 'lead';
    if (projects.length > 0) {
      const hasActiveProject = projects.some(p => 
        ['first_call', 'proposal', 'gantt', 'sketches', 'rendering', 'technical', 'execution'].includes(p.status)
      );
      const allCompleted = projects.every(p => p.status === 'completion');
      
      if (hasActiveProject) {
        newStatus = 'active';
      } else if (allCompleted) {
        newStatus = 'completed';
      }
    }

    await base44.entities.Client.update(clientId, { status: newStatus });
    return true;
  } catch (error) {
    console.error('Error updating client status:', error);
    return false;
  }
}