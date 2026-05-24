import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (db) return db;

  db = new Database(path.join(process.cwd(), "job-tracker.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id             TEXT PRIMARY KEY,
      company        TEXT NOT NULL,
      role           TEXT NOT NULL,
      job_url        TEXT,
      status         TEXT NOT NULL DEFAULT 'Applied',
      applied_date   TEXT NOT NULL,
      followup_date  TEXT,
      notes          TEXT,
      cv_file        TEXT,
      cv_url         TEXT,
      cl_file        TEXT,
      cl_url         TEXT,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id             TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      round          INTEGER NOT NULL DEFAULT 1,
      type           TEXT NOT NULL DEFAULT 'Phone',
      date           TEXT NOT NULL,
      interviewer    TEXT,
      notes          TEXT,
      created_at     TEXT NOT NULL
    );
  `);

  // Migrate existing DBs that don't have followup_date yet
  const cols = (db.pragma("table_info(applications)") as { name: string }[]).map((c) => c.name);
  if (!cols.includes("followup_date")) {
    db.exec("ALTER TABLE applications ADD COLUMN followup_date TEXT");
  }

  return db;
}
