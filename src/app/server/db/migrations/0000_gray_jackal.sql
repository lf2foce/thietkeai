CREATE TABLE IF NOT EXISTS "t3gallery_image" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"url" varchar(1024) NOT NULL,
	"userId" varchar(256) NOT NULL,
	"design" varchar(50) NOT NULL,
	"type" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "t3gallery_image" USING btree ("name");