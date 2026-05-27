import { defineConfig } from 'drizzle-kit';
import { dbPath } from './src/context';

export default defineConfig({
  out: './share/drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbPath,
  },
});