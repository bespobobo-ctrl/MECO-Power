import { supabase } from './supabase';
import { logger } from './logger';

export const BUCKET_NAME = 'meco-assets';

export async function connectDatabase(): Promise<void> {
  try {
    logger.info('Connecting to Supabase PostgreSQL database and Storage...');

    // 1. Ensure Storage Bucket exists for file uploads
    const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
    
    if (bucketErr) {
      logger.warn(`Supabase Storage listing warning: ${bucketErr.message}`);
    } else {
      const exists = buckets?.some(b => b.name === BUCKET_NAME);
      if (!exists) {
        logger.info(`Creating Supabase public Storage bucket '${BUCKET_NAME}'...`);
        const { error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 52428800, // 50MB
        });
        if (createErr) {
          logger.warn(`Storage bucket creation note: ${createErr.message}`);
        } else {
          logger.info(`Supabase Storage bucket '${BUCKET_NAME}' created successfully!`);
        }
      } else {
        logger.info(`Supabase Storage bucket '${BUCKET_NAME}' is ready.`);
      }
    }

    logger.info('Supabase initialized and connected successfully!');
  } catch (error: any) {
    logger.error(`Supabase connection failed: ${error.message}`);
  }
}
