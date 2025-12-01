import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.warn('Supabase env vars missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
}

export const supabase = createClient(
    url || '',
    serviceRoleKey || '',
    {
        auth: { autoRefreshToken: false, persistSession: false }
    }
)
