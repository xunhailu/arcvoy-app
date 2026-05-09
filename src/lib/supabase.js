import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseKey &&
  supabaseKey !== 'your_anon_key_here'
)

if (!isSupabaseConfigured) {
  console.warn(
    '[Arcvoy] Supabase env vars missing — running in PREVIEW MODE with sample data.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable live data features.'
  )
}

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseKey  || 'placeholder-key',
  { auth: { flowType: 'implicit' } }
)
