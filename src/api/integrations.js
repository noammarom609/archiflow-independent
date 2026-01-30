// Integrations - Supabase Edge Functions and Storage
import { supabase as defaultSupabase } from '@/lib/supabase';
import { getClient } from './entities';

// Invoke LLM via Edge Function (will call OpenAI)
export const InvokeLLM = async (params) => {
  const client = getClient();
  const { data, error } = await client.functions.invoke('invoke-llm', {
    body: params
  });
  
  if (error) throw error;
  return data;
};

// Send Email via Edge Function (will use Resend)
export const SendEmail = async (params) => {
  const client = getClient();
  const { data, error } = await client.functions.invoke('send-email', {
    body: params
  });
  
  if (error) throw error;
  return data;
};

// Send SMS via Edge Function (placeholder - implement with Twilio if needed)
export const SendSMS = async (params) => {
  const client = getClient();
  const { data, error } = await client.functions.invoke('send-sms', {
    body: params
  });
  
  if (error) throw error;
  return data;
};

// Upload File to Supabase Storage
export const UploadFile = async ({ file, bucket = 'documents' }) => {
  const client = getClient();
  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop();
  const fileName = `${timestamp}-${randomStr}.${ext}`;
  
  // Upload to Supabase Storage
  const { data, error } = await client.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = client.storage
    .from(bucket)
    .getPublicUrl(data.path);
  
  return {
    url: publicUrl,
    path: data.path,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size
  };
};

// Generate Image via Edge Function (will call DALL-E or Stable Diffusion)
export const GenerateImage = async (params) => {
  const client = getClient();
  const { data, error } = await client.functions.invoke('generate-image', {
    body: params
  });
  
  if (error) throw error;
  return data;
};

// Extract Data from Uploaded File via Edge Function
export const ExtractDataFromUploadedFile = async (params) => {
  const client = getClient();
  const { data, error } = await client.functions.invoke('extract-file-data', {
    body: params
  });
  
  if (error) throw error;
  return data;
};

// Core object for backwards compatibility
export const Core = {
  InvokeLLM,
  SendEmail,
  SendSMS,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile
};

// Helper to invoke any edge function
export const invokeFunction = async (functionName, params = {}) => {
  const client = getClient();
  const { data, error } = await client.functions.invoke(functionName, {
    body: params
  });
  
  if (error) throw error;
  return data;
};

// Export supabase for direct access
export { defaultSupabase as supabase, getClient };






