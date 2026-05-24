import { defineConfig } from 'drizzle-kit';
import os from "node:os";
import path from "node:path";

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: import.meta.env.DB_FILE_NAME! ?? path.join(os.homedir(), ".local/share/living-drive-tonic/sqlite.db"),
  },
});