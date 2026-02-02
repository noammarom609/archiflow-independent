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
  // Migration 015 - Critical entities
  RecordingFolder: entities.RecordingFolder,
  DocumentSignature: entities.DocumentSignature,
  ShareLink: entities.ShareLink,
  ClientAccess: entities.ClientAccess,
  // Migration 016 - Specialized entities
  ContractorDocument: entities.ContractorDocument,
  ConsultantMessage: entities.ConsultantMessage,
  ConsultantDocument: entities.ConsultantDocument,
  CADFile: entities.CADFile,
  ProjectSelection: entities.ProjectSelection,
  // Migration 017 - AI tracking entities
  AILearning: entities.AILearning,
  ProjectAIHistory: entities.ProjectAIHistory,
  // Migration 052 - Lead management
  LeadFollowup: entities.LeadFollowup,
  Event: entities.Event,
};

// Get Supabase config from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Functions wrapper - invokes Supabase edge functions
// Uses direct fetch to ensure proper headers are sent
const functionsWrapper = {
  invoke: async (functionName, params = {}) => {
    // Convert camelCase to kebab-case for Supabase
    const kebabName = functionName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    
    console.log(`[Archiflow] Invoking function: ${kebabName}`);
    
    // Build the URL
    const url = `${SUPABASE_URL}/functions/v1/${kebabName}`;
    console.log(`[Archiflow] Function URL: ${url}`);
    
    try {
      // Make direct fetch call with proper headers
      // The apikey header is required for Supabase to identify the project
      // Authorization with anon key is needed for functions deployed with --no-verify-jwt
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(params)
      });
      
      console.log(`[Archiflow] Response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`[Archiflow] Function error:`, data);
        return { data: { error: data.message || data.error || 'Function error' }, error: data };
      }
      
      console.log(`[Archiflow] Response data:`, data);
      return { data };
    } catch (err) {
      console.error(`[Archiflow] Function exception:`, err);
      return { data: { error: err.message }, error: err };
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
// integrations.Core is used across the app (UploadFile, InvokeLLM, etc.)
export const archiflow = {
  entities: entityMap,
  functions: functionsWrapper,
  auth: authWrapper,
  integrations: { Core: integrations.Core },
  
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
