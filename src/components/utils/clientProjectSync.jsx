/**
 * Client-Project Synchronization Utilities
 * 
 * This module provides helper functions for maintaining data consistency
 * between Client and Project entities, including:
 * - Syncing client details to projects
 * - Adding events to client timeline
 * - Auto-populating data between entities
 */

import { base44 } from '@/api/base44Client';

/**
 * Sync client contact details to all associated projects
 * Call this when client contact info changes
 */
export async function syncClientToProjects(clientId, clientData, projects) {
  const updates = projects
    .filter(p => p.client_id === clientId)
    .map(project => 
      base44.entities.Project.update(project.id, {
        client: clientData.full_name,
        client_email: clientData.email,
        client_phone: clientData.phone,
      })
    );
  
  return Promise.all(updates);
}

/**
 * Add an event to the client's timeline
 * This should be called whenever a significant action occurs in a project
 */
export async function addClientTimelineEvent(clientId, event) {
  const client = await base44.entities.Client.filter({ id: clientId });
  if (!client || client.length === 0) return null;
  
  const existingTimeline = client[0].timeline || [];
  
  const newEvent = {
    date: new Date().toISOString(),
    ...event,
  };
  
  // Update client with new timeline event
  await base44.entities.Client.update(clientId, {
    timeline: [...existingTimeline, newEvent],
    last_contact_date: new Date().toISOString().split('T')[0],
  });
  
  return newEvent;
}

/**
 * Timeline event types and their configurations
 */
export const TIMELINE_EVENT_TYPES = {
  PHONE_CALL: {
    type: 'phone_call',
    getTitle: (projectName) => `שיחת טלפון - ${projectName}`,
  },
  FIRST_MEETING: {
    type: 'first_meeting',
    getTitle: (projectName) => `פגישה ראשונה - ${projectName}`,
  },
  PROPOSAL_CREATED: {
    type: 'proposal',
    getTitle: (projectName) => `הצעת מחיר נוצרה - ${projectName}`,
  },
  PROPOSAL_SIGNED: {
    type: 'signature',
    getTitle: () => `חתימה על הצעת מחיר`,
  },
  STAGE_CHANGE: {
    type: 'gantt',
    getTitle: (stage) => `מעבר לשלב: ${stage}`,
  },
  SKETCHES_APPROVED: {
    type: 'sketches',
    getTitle: () => `אישור סקיצות`,
  },
  RENDERINGS_APPROVED: {
    type: 'renderings',
    getTitle: () => `אישור הדמיות`,
  },
  TECHNICAL_APPROVED: {
    type: 'technical',
    getTitle: () => `אישור תוכניות טכניות`,
  },
  DOCUMENT_SIGNED: {
    type: 'signature',
    getTitle: (docTitle) => `חתימה על ${docTitle}`,
  },
  PAYMENT_RECEIVED: {
    type: 'payment',
    getTitle: (amount) => `תשלום התקבל: ₪${amount}`,
  },
  PROJECT_COMPLETED: {
    type: 'completion',
    getTitle: (projectName) => `פרויקט הושלם: ${projectName}`,
  },
};

/**
 * Create a timeline event object for client
 */
export function createTimelineEvent(eventType, data) {
  const config = TIMELINE_EVENT_TYPES[eventType];
  if (!config) {
    console.warn(`Unknown timeline event type: ${eventType}`);
    return null;
  }
  
  return {
    type: config.type,
    title: config.getTitle(data.titleParam),
    description: data.description || '',
    project_id: data.projectId,
    project_name: data.projectName,
    stage: data.stage,
    data: data.metadata || null,
  };
}

/**
 * Get client data formatted for auto-populating forms
 */
export function getClientDataForForm(client) {
  if (!client) return {};
  
  return {
    clientId: client.id,
    clientName: client.full_name,
    clientEmail: client.email,
    clientPhone: client.phone,
    clientAddress: client.address,
    clientPreferences: client.preferences,
    clientAiInsights: client.ai_insights,
  };
}

/**
 * Get project data formatted for proposal creation
 */
export function getProjectDataForProposal(project, client) {
  if (!project) return {};
  
  const stylePreferences = [
    ...(project.ai_summary?.style_preferences || []),
    ...(client?.preferences?.styles || []),
  ];
  
  return {
    projectId: project.id,
    projectName: project.name,
    projectLocation: project.location,
    projectBudget: project.budget,
    projectTimeline: project.timeline,
    clientId: client?.id || project.client_id,
    clientName: client?.full_name || project.client,
    clientEmail: client?.email || project.client_email,
    clientPhone: client?.phone || project.client_phone,
    stylePreferences: [...new Set(stylePreferences)],
    budgetRange: client?.preferences?.budget_range || project.budget,
  };
}