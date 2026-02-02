import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { sequelize } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationsTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations() {
  const [rows] = await sequelize.query(`SELECT name FROM migrations ORDER BY name ASC;`);
  return new Set(rows.map((r) => r.name));
}

async function listMigrationFiles() {
  const files = await fs.readdir(MIGRATIONS_DIR);
  return files
    .filter((f) => /^\d+-.+\.js$/.test(f))
    .sort((a, b) => a.localeCompare(b));
}

async function runMigration(fileName, queryInterface, Sequelize) {
  const filePath = pathToFileURL(path.join(MIGRATIONS_DIR, fileName)).href;
  const mod = await import(filePath);

  if (typeof mod.up !== "function") {
    throw new Error(`${fileName} does not export async function up(...)`);
  }

  await mod.up(queryInterface, Sequelize);
  await sequelize.query(`INSERT INTO migrations (name) VALUES ($1);`, {
    bind: [fileName],
  });
}

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    await ensureMigrationsTable();

    const applied = await getAppliedMigrations();
    const files = await listMigrationFiles();

    const queryInterface = sequelize.getQueryInterface();
    const Sequelize = await import("sequelize");

    let ranAny = false;

    for (const f of files) {
      if (applied.has(f)) continue;
      console.log(`Running migration: ${f}`);
      await runMigration(f, queryInterface, Sequelize);
      console.log(`Applied: ${f}`);
      ranAny = true;
    }

    if (!ranAny) {
      console.log("No pending migrations");
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    try {
      await sequelize.close();
    } catch {}
    process.exit(1);
  }
}

migrate();
