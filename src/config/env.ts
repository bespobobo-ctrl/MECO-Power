import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_meco_power_uzbekistan_key_2026',
  ALLOWED_ORIGINS: ['*'],
  REGION: 'Uzbekistan',
  supabaseUrl: process.env.SUPABASE_URL || 'https://udknramozyniwkcnhvik.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};
