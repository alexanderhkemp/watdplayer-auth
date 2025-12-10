import { neon } from '@neondatabase/serverless';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL is not set. Please add it in Vercel env variables.');
}

export const sql = neon(connectionString);
