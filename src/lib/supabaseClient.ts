import { createClient } from '@supabase/supabase-js'

const getEnvVar = (name: string): string => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Try to get from window.__ENV if available (for runtime config)
    const win = window as any
    if (win.__ENV && win.__ENV[name]) {
      return win.__ENV[name]
    }
  }
  return process.env[name] || ''
}

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Validate environment variables
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder'))) {
  console.error('❌ Supabase environment variables are not set correctly!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)