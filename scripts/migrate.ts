import { config } from "dotenv";
import { sql } from "@vercel/postgres";

config({ path: ".env" });

async function migrate() {
  console.log("Running migration...");

  await sql`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('user', 'admin');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE generation_mode AS ENUM ('standard', 'style-ref');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE generation_status AS ENUM ('succeeded', 'failed');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE cost_type AS ENUM ('free', 'credit', 'admin');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            VARCHAR(256) PRIMARY KEY,
      email         VARCHAR(256),
      role          user_role NOT NULL DEFAULT 'user',
      credits       INTEGER NOT NULL DEFAULT 0,
      daily_used_count  INTEGER NOT NULL DEFAULT 0,
      daily_reset_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✓ users table");

  await sql`
    CREATE TABLE IF NOT EXISTS generations (
      id          SERIAL PRIMARY KEY,
      user_id     VARCHAR(256) NOT NULL,
      mode        generation_mode NOT NULL,
      room_type   VARCHAR(50),
      theme       VARCHAR(50),
      status      generation_status NOT NULL,
      cost_type   cost_type NOT NULL,
      created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS generations_user_idx ON generations(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS generations_created_at_idx ON generations(created_at);`;
  console.log("✓ generations table");

  await sql`
    CREATE TABLE IF NOT EXISTS images (
      id                SERIAL PRIMARY KEY,
      name              VARCHAR(256),
      url               VARCHAR(1024) NOT NULL,
      original_image_id VARCHAR(256),
      generation_id     INTEGER,
      user_id           VARCHAR(256),
      design            VARCHAR(50) NOT NULL,
      type              VARCHAR(50) NOT NULL,
      created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at        TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS images_user_idx ON images(user_id);`;
  console.log("✓ images table");

  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id          SERIAL PRIMARY KEY,
      user_id     VARCHAR(256) NOT NULL,
      user_email  VARCHAR(256) NOT NULL,
      role        VARCHAR(50) NOT NULL,
      rating      INTEGER NOT NULL,
      message     TEXT NOT NULL,
      created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log("✓ feedback table");

  console.log("\nMigration complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
