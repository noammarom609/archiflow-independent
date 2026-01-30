// Archiflow Database Client
// This is the main database client for Archiflow - a completely independent project
// Uses Supabase as the backend with a compatibility layer for existing code patterns
// Note: The 'base44' naming is kept for backward compatibility with existing imports

import { supabase } from '@/lib/supabase';
import * as entities from './entities';
import * as integrations from './integrations';

// Entity name mapping (for base44.entities.EntityName syntax)
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

// Functions wrapper - converts base44 function names to Supabase edge function names
const functionsWrapper = {
  invoke: async (functionName, params = {}) => {
    // Convert camelCase to kebab-case for Supabase
    const kebabName = functionName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    
    const { data, error } = await supabase.functions.invoke(kebabName, {
      body: params
    });
    
    if (error) throw error;
    return { data };
  }
};

// Auth wrapper - uses Clerk through AuthContext
// Note: Most auth operations should use useAuth() hook instead
const authWrapper = {
  me: async () => {
    // This should be called through AuthContext
    console.warn('[base44 compat] auth.me() is deprecated. Use useAuth() hook instead.');
    return null;
  },
  logout: (redirectUrl) => {
    // This should be handled through AuthContext
    console.warn('[base44 compat] auth.logout() is deprecated. Use useAuth().logout() instead.');
    window.location.href = redirectUrl || '/LandingHome';
  },
  redirectToLogin: (returnUrl) => {
    // This should be handled through AuthContext
    console.warn('[base44 compat] auth.redirectToLogin() is deprecated. Use useAuth().navigateToLogin() instead.');
  },
  isAuthenticated: async () => {
    console.warn('[base44 compat] auth.isAuthenticated() is deprecated. Use useAuth() hook instead.');
    return false;
  }
};

// Create base44-compatible client object
export const base44 = {
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
