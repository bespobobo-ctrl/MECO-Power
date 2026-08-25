import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import { logger } from './logger';

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  logger.warn('Supabase URL or Service Role Key missing in env');
}

export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey || env.supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
