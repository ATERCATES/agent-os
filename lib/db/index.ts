import Database from "better-sqlite3";
import path from "path";
import os from "os";
import { createSchema } from "./schema";
import { runMigrations } from "./migrations";

export * from "./types";
export { queries } from "./queries";

const DB_DIR = path.join(os.homedir(), ".claude-deck");
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, "data.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const fs = require("fs");
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    _db.pragma("busy_timeout = 5000");
  }
  return _db;
}

let _initialized = false;

export async function initDb(): Promise<Database.Database> {
  const db = getDb();

  if (!_initialized) {
    createSchema(db);
    runMigrations(db);
    _initialized = true;
  }

  return db;
}

export async function closeDb(): Promise<void> {
  if (_db) {
    _db.close();
    _db = null;
    _initialized = false;
  }
}
