import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_meco_power_uzbekistan_key_2026',
  ALLOWED_ORIGINS: ['*'],
  REGION: 'Uzbekistan',
  supabaseUrl: process.env.SUPABASE_URL || 'https://udknramozyniwkcnhvik.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka25yYW1venluaXdrY25odmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MzQ0NjQsImV4cCI6MjEwMzIxMDQ2NH0.Na3QdNL4UqdcizBgkDDWNNphFXz3wQDhg0i02iKEfrE',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka25yYW1venluaXdrY25odmlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzYzNDQ2NCwiZXhwIjoyMTAzMjEwNDY0fQ.Vxq0LGwh0mSi_XCWPBBig4nlU8365J_Pgoqv-RBSHjs',
};
