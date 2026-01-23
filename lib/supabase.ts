import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// createBrowserClient を使うことで、ログイン情報が自動的にCookieに保存され、
// middleware.ts と情報を共有できるようになります。
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)