import "dotenv/config";
import { sequelize } from "./config.js";

export async function up() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sequelize.query(`
    INSERT INTO workspaces (name)
    VALUES ('Personal'), ('School')
    ON CONFLICT (name) DO NOTHING;
  `);

  await sequelize.query(`
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS "workspaceId" INTEGER;
  `);

  await sequelize.query(`
    UPDATE articles
    SET "workspaceId" = COALESCE("workspaceId", 1);
  `);

  await sequelize.query(`
    ALTER TABLE articles
    ALTER COLUMN "workspaceId" SET NOT NULL;
  `);

  await sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'articles_workspace_fk'
      ) THEN
        ALTER TABLE articles
        ADD CONSTRAINT articles_workspace_fk
        FOREIGN KEY ("workspaceId") REFERENCES workspaces(id)
        ON DELETE RESTRICT;
      END IF;
    END$$;
  `);
}

export async function down() {
  await sequelize.query(`
    ALTER TABLE articles DROP COLUMN IF EXISTS "workspaceId";
  `);
  await sequelize.query(`
    DROP TABLE IF EXISTS workspaces;
  `);
}

if (process.argv[1].includes("migrate-workspaces")) {
  up()
    .then(() => console.log("Migration complete: workspaces + workspaceId ready"))
    .catch((e) => {
      console.error("Migration failed:", e);
      process.exit(1);
    })
    .finally(() => sequelize.close());
}
