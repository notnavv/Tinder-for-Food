import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * The one shared Supabase client. null until frontend/.env.local has
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Code that needs it should
 * handle null (show a "not configured" message, or use mock mode).
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true' || !supabase
