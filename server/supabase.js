import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using the SERVICE_ROLE key.
 * This key bypasses Row Level Security, so it MUST stay on the server only
 * (no VITE_ prefix → never bundled into the browser).
 */

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const hasSupabase = !!(url && serviceKey)

export const supabase = hasSupabase
  ? createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null
