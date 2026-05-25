-- Run this once in the Neon SQL Editor after creating your database

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id            TEXT PRIMARY KEY,
  company       TEXT NOT NULL,
  role          TEXT NOT NULL,
  job_url       TEXT,
  status        TEXT NOT NULL DEFAULT 'Applied',
  platform      TEXT,
  applied_date  TEXT NOT NULL,
  followup_date TEXT,
  notes         TEXT,
  cv_file       TEXT,
  cv_url        TEXT,
  cl_file       TEXT,
  cl_url        TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
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
