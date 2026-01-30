// Archiflow Database Client
// Main database client for Archiflow - an independent architecture project management system
// Uses Supabase as the backend

import { supabase } from '@/lib/supabase';
import * as entities from './entities';
import { getClient } from './entities';
import * as integrations from './integrations';

// Entity name mapping (for archiflow.entities.EntityName syntax)
const entityMap = {
  Project: entities.Project,
  Client: entities.Client,
  Task: entities.Task,
  Document: entities.Document,
  Recording: entities.Recording,
  Proposal: entities.Proposal,
  Invoice: entities.Invoice,
  Expense: entities.Expense,
  Receipt: entities.Receipt,
  User: entities.User,
  TeamMember: entities.TeamMember,
  Consultant: entities.Consultant,
  Contractor: entities.Contractor,
  Supplier: entities.Supplier,
  Notification: entities.Notification,
  Comment: entities.Comment,
  Message: entities.Message,
  CalendarEvent: entities.CalendarEvent,
  TimeEntry: entities.TimeEntry,
  JournalEntry: entities.JournalEntry,
  Moodboard: entities.Moodboard,
  DesignAsset: entities.DesignAsset,
  ContentItem: entities.ContentItem,
  ProposalTemplate: entities.ProposalTemplate,
  ProposalClause: entities.ProposalClause,
  ProjectPermission: entities.ProjectPermission,
  ProjectConsultant: entities.ProjectConsultant,
  MeetingSlot: entities.MeetingSlot,
  PushSubscription: entities.PushSubscription,
  ContractorQuote: entities.ContractorQuote,
  ConsultantTask: entities.ConsultantTask,
  SystemSettings: entities.SystemSettings,
  TranscriptionCorrection: entities.TranscriptionCorrection,
  UserGoogleToken: entities.UserGoogleToken,
};

// Functions wrapper - invokes Supabase edge functions
const functionsWrapper = {
  invoke: async (functionName, params = {}) => {
    // Convert camelCase to kebab-case for Supabase
    const kebabName = functionName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    
    console.log(`[Archiflow] Invoking function: ${kebabName}`);
    
    try {
      // Use authenticated client if available
      const client = getClient();
      const { data, error } = await client.functions.invoke(kebabName, {
        body: params
      });
      
      if (error) {
        console.error(`[Archiflow] Function error:`, error);
        // Return error as data so caller can handle it
        return { data: { error: error.message || error }, error };
      }
      return { data };
    } catch (err) {
      console.error(`[Archiflow] Function exception:`, err);
      // Try to parse error context if available
      if (err.context?.body) {
        try {
          const bodyText = await err.context.body.text?.() || err.context.body;
          const parsed = typeof bodyText === 'string' ? JSON.parse(bodyText) : bodyText;
          console.log(`[Archiflow] Error body:`, parsed);
          return { data: parsed, error: err };
        } catch (parseErr) {
          console.log(`[Archiflow] Could not parse error body`);
        }
      }
      throw err;
    }
  }
};

// Auth wrapper - uses Clerk through AuthContext
// Note: Most auth operations should use useAuth() hook instead
const authWrapper = {
  me: async () => {
    console.warn('[Archiflow] auth.me() is deprecated. Use useAuth() hook instead.');
    return null;
  },
  logout: (redirectUrl) => {
    console.warn('[Archiflow] auth.logout() is deprecated. Use useAuth().logout() instead.');
    window.location.href = redirectUrl || '/LandingHome';
  },
  redirectToLogin: (returnUrl) => {
    console.warn('[Archiflow] auth.redirectToLogin() is deprecated. Use useAuth().navigateToLogin() instead.');
  },
  isAuthenticated: async () => {
    console.warn('[Archiflow] auth.isAuthenticated() is deprecated. Use useAuth() hook instead.');
    return false;
  }
};

// Create Archiflow client object
export const archiflow = {
  entities: entityMap,
  functions: functionsWrapper,
  auth: authWrapper,
  integrations: integrations.Core,
  
  // For service role operations (should be done in Edge Functions)
  asServiceRole: {
    entities: entityMap,
    functions: functionsWrapper,
  }
};

// Log initialization
console.log('[Archiflow] Database client initialized');

// Export for direct Supabase access
export { supabase };
