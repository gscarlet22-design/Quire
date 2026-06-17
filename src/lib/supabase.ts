import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Browser client — safe to use in client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client — full access, only use in server actions / API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
