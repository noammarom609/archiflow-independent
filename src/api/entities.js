// Archiflow Entity Helpers
// Database entity operations using Supabase
// Part of Archiflow - an independent architecture project management system

import { supabase } from '@/lib/supabase';

// Entity name to table name mapping (PascalCase -> snake_case)
const tableNameMap = {
  Project: 'projects',
  Client: 'clients',
  Task: 'tasks',
  Document: 'documents',
  Recording: 'recordings',
  Proposal: 'proposals',
  Invoice: 'invoices',
  Expense: 'expenses',
  Receipt: 'receipts',
  User: 'users',
  TeamMember: 'team_members',
  Consultant: 'consultants',
  Contractor: 'contractors',
  Supplier: 'suppliers',
  Notification: 'notifications',
  Comment: 'comments',
  Message: 'messages',
  CalendarEvent: 'calendar_events',
  TimeEntry: 'time_entries',
  JournalEntry: 'journal_entries',
  Moodboard: 'moodboards',
  DesignAsset: 'design_assets',
  ContentItem: 'content_items',
  ProposalTemplate: 'proposal_templates',
  ProposalClause: 'proposal_clauses',
  ProjectPermission: 'project_permissions',
  ProjectConsultant: 'project_consultants',
  MeetingSlot: 'meeting_slots',
  PushSubscription: 'push_subscriptions',
  ContractorQuote: 'contractor_quotes',
  ConsultantTask: 'consultant_tasks',
  SystemSettings: 'system_settings',
  TranscriptionCorrection: 'transcription_corrections',
  UserGoogleToken: 'user_google_tokens',
};

// Get table name from entity name
const getTableName = (entityName) => {
  return tableNameMap[entityName] || entityName.toLowerCase() + 's';
};

// Parse sort string (e.g., '-created_date' -> { column: 'created_date', ascending: false })
const parseSort = (sortStr) => {
  if (!sortStr) return null;
  const ascending = !sortStr.startsWith('-');
  const column = sortStr.replace(/^-/, '');
  return { column, ascending };
};

// Create entity helper with CRUD operations
const createEntityHelper = (entityName) => {
  const tableName = getTableName(entityName);

  return {
    // List all records
    list: async (sortBy = null, limit = null) => {
      let query = supabase.from(tableName).select('*');
      
      const sort = parseSort(sortBy);
      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending });
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    // Filter records
    filter: async (filters = {}, sortBy = null, limit = null) => {
      let query = supabase.from(tableName).select('*');
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
      
      const sort = parseSort(sortBy);
      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending });
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    // Get single record by ID
    get: async (id) => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    // Create new record
    create: async (data) => {
      const { data: created, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return created;
    },

    // Update record
    update: async (id, data) => {
      const { data: updated, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },

    // Delete record
    delete: async (id) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },

    // Upsert record
    upsert: async (data, options = {}) => {
      const { data: upserted, error } = await supabase
        .from(tableName)
        .upsert(data, options)
        .select()
        .single();
      
      if (error) throw error;
      return upserted;
    },
  };
};

// Export entity helpers
export const Project = createEntityHelper('Project');
export const Client = createEntityHelper('Client');
export const Task = createEntityHelper('Task');
export const Document = createEntityHelper('Document');
export const Recording = createEntityHelper('Recording');
export const Proposal = createEntityHelper('Proposal');
export const Invoice = createEntityHelper('Invoice');
export const Expense = createEntityHelper('Expense');
export const Receipt = createEntityHelper('Receipt');
export const TeamMember = createEntityHelper('TeamMember');
export const Consultant = createEntityHelper('Consultant');
export const Contractor = createEntityHelper('Contractor');
export const Supplier = createEntityHelper('Supplier');
export const Notification = createEntityHelper('Notification');
export const Comment = createEntityHelper('Comment');
export const Message = createEntityHelper('Message');
export const CalendarEvent = createEntityHelper('CalendarEvent');
export const TimeEntry = createEntityHelper('TimeEntry');
export const JournalEntry = createEntityHelper('JournalEntry');
export const Moodboard = createEntityHelper('Moodboard');
export const DesignAsset = createEntityHelper('DesignAsset');
export const ContentItem = createEntityHelper('ContentItem');
export const ProposalTemplate = createEntityHelper('ProposalTemplate');
export const ProposalClause = createEntityHelper('ProposalClause');
export const ProjectPermission = createEntityHelper('ProjectPermission');
export const ProjectConsultant = createEntityHelper('ProjectConsultant');
export const MeetingSlot = createEntityHelper('MeetingSlot');
export const PushSubscription = createEntityHelper('PushSubscription');
export const ContractorQuote = createEntityHelper('ContractorQuote');
export const ConsultantTask = createEntityHelper('ConsultantTask');
export const SystemSettings = createEntityHelper('SystemSettings');
export const TranscriptionCorrection = createEntityHelper('TranscriptionCorrection');
export const UserGoogleToken = createEntityHelper('UserGoogleToken');
export const User = createEntityHelper('User');

// Query helper for more complex queries
export const Query = {
  from: (tableName) => supabase.from(tableName),
  rpc: (fnName, params) => supabase.rpc(fnName, params),
};

// Export the raw supabase client for advanced usage
export { supabase };