import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { Application, Status } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const db = getDB();
  const status = req.nextUrl.searchParams.get("status");

  const rows = status
    ? db.prepare("SELECT * FROM applications WHERE status = ? ORDER BY applied_date DESC").all(status)
    : db.prepare("SELECT * FROM applications ORDER BY applied_date DESC").all();

  return NextResponse.json(rows as Application[]);
}

export async function POST(req: NextRequest) {
  const db = getDB();
  const body = await req.json();

  const now = new Date().toISOString();
  const id = uuidv4();

  const app: Application = {
    id,
    company: body.company,
    role: body.role,
    job_url: body.job_url || null,
    status: (body.status as Status) || "Applied",
    applied_date: body.applied_date || now.slice(0, 10),
    followup_date: body.followup_date || null,
    notes: body.notes || null,
    cv_file: body.cv_file || null,
    cv_url: body.cv_url || null,
    cl_file: body.cl_file || null,
    cl_url: body.cl_url || null,
    created_at: now,
    updated_at: now,
  };

  db.prepare(`
    INSERT INTO applications (id, company, role, job_url, status, applied_date, followup_date, notes,
      cv_file, cv_url, cl_file, cl_url, created_at, updated_at)
    VALUES (@id, @company, @role, @job_url, @status, @applied_date, @followup_date, @notes,
      @cv_file, @cv_url, @cl_file, @cl_url, @created_at, @updated_at)
  `).run(app);

  return NextResponse.json(app, { status: 201 });
}
