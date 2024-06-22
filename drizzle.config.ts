import { config } from 'dotenv';
import { defineConfig } from "drizzle-kit";

config({ path: '.env' });

export default defineConfig({
  schema: "./app/server/db/schema.ts",
  out: "./app/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // url: process.env.NEON_DATABASE_URL!,
    url: process.env.POSTGRES_URL!,
  },
});
