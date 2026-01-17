import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug: Log environment variables (masked for security)
console.log('🔧 Supabase Config:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}... (${supabaseAnonKey.length} chars)` : 'NOT SET'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are missing!');
  console.error('Please check your .env file has:');
  console.error('  VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
