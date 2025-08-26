import { sql } from "drizzle-orm";

export async function up(db: any): Promise<void> {
  // Ensure UUID generator exists
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  // 1) Add column with default for new rows
  await db.execute(sql`
    ALTER TABLE orgs
    ADD COLUMN IF NOT EXISTS external_id TEXT DEFAULT gen_random_uuid()::text;
  `);

  // 2) Backfill existing rows
  await db.execute(sql`
    UPDATE orgs
    SET external_id = gen_random_uuid()::text
    WHERE external_id IS NULL;
  `);

  // 3) Not null
  await db.execute(sql`
    ALTER TABLE orgs
    ALTER COLUMN external_id SET NOT NULL;
  `);

  // 4) Unique + index (unique already indexes, optional extra plain index not needed)
  await db.execute(sql`
    ALTER TABLE orgs
    ADD CONSTRAINT IF NOT EXISTS orgs_external_id_unique UNIQUE (external_id);
  `);
}

export async function down(db: any): Promise<void> {
  await db.execute(sql`ALTER TABLE orgs DROP CONSTRAINT IF EXISTS orgs_external_id_unique;`);
  await db.execute(sql`ALTER TABLE orgs DROP COLUMN IF EXISTS external_id;`);
  // Keeping pgcrypto installed is harmless.
} 