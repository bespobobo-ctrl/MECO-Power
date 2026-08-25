import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import { logger } from './logger';

const url = env.supabaseUrl || 'https://udknramozyniwkcnhvik.supabase.co';
const key = env.supabaseServiceRoleKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka25yYW1venluaXdrY25odmlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzYzNDQ2NCwiZXhwIjoyMTAzMjEwNDY0fQ.Vxq0LGwh0mSi_XCWPBBig4nlU8365J_Pgoqv-RBSHjs';

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
