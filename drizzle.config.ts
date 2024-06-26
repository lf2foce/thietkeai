import { config } from 'dotenv';
import { defineConfig } from "drizzle-kit";

config({ path: '.env' });

export default defineConfig({
  schema: "./src/app/server/db/schema.ts",
  out: "./src/app/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // url: process.env.NEON_DATABASE_URL!,
    url: process.env.POSTGRES_URL!,
  },
});
