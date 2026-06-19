import { join } from 'path';
import { config } from 'dotenv';
config({ path: join(process.cwd(), '../../.env') });
import { envSchema } from './env.schema';

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables');
  console.error(parsed.error.format()); 
  process.exit(1);
}

export const env = {
  ...parsed.data,
};
