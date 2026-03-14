// src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Use VITE_ prefix for Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Prevent "supabaseUrl is required" crash by providing valid-format placeholders
// if environment variables are not yet set in the dashboard.
const fallbackUrl = 'https://your-project-id.supabase.co';
const fallbackKey = 'your-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ TRANSFORM RPG: Supabase credentials missing in .env.\n' +
    'Auth features will be disabled. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackKey
);
