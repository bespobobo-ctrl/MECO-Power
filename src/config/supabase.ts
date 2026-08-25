import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import { logger } from './logger';

const url = env.supabaseUrl || 'https://udknramozyniwkcnhvik.supabase.co';
const key = env.supabaseServiceRoleKey || env.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka25yYW1venluaXdrY25odmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MzQ0NjQsImV4cCI6MjEwMzIxMDQ2NH0.Na3QdNL4UqdcizBgkDDWNNphFXz3wQDhg0i02iKEfrE';

export const supabase = createClient(
  url,
  key,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
