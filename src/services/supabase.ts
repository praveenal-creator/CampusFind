import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvOrStorage = (key: string): string => {
  if (typeof window !== 'undefined') {
    const fromEnv = import.meta.env[key];
    if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim() !== '') {
      return fromEnv.trim();
    }
    const fromStorage = localStorage.getItem(key);
    if (fromStorage && typeof fromStorage === 'string' && fromStorage.trim() !== '') {
      return fromStorage.trim();
    }
  }
  return (import.meta.env[key] as string) || '';
};

export const getSupabaseConfig = () => {
  const url = getEnvOrStorage('VITE_SUPABASE_URL');
  const key = getEnvOrStorage('VITE_SUPABASE_ANON_KEY');
  const isConfigured = Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('your-project-id')
  );
  return { url, key, isConfigured };
};

const config = getSupabaseConfig();

export const isSupabaseConfigured = config.isConfigured;

// Guaranteed non-null SupabaseClient with session persistence
export const supabase: SupabaseClient = createClient(
  config.url || 'https://placeholder-project.supabase.co',
  config.key || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  }
);

export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string }> {
  const url = customUrl || config.url;
  const key = customKey || config.key;

  if (!url || !key || !url.startsWith('http') || url.includes('your-project-id')) {
    return {
      success: false,
      message: 'Supabase URL or Anon key is missing or contains placeholder values.'
    };
  }

  try {
    const testClient = createClient(url, key);
    const { error } = await testClient.from('reports').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, it's connected to Supabase but needs SQL migration
      if (error.message.includes('relation "public.reports" does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase project! Please run supabase/schema.sql in SQL Editor to create tables.'
        };
      }
      return {
        success: false,
        message: `Supabase query error: ${error.message}`
      };
    }
    return {
      success: true,
      message: 'Successfully connected and verified database tables on Supabase!'
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Connection failed: ${errorMessage}`
    };
  }
}
