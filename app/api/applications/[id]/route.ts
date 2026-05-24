import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { Application, Status } from "@/lib/types";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const db = getDB();
  const row = db.prepare("SELECT * FROM applications WHERE id = ?").get(params.id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row as Application);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const db = getDB();
  const body = await req.json();
  const now = new Date().toISOString();

  const existing = db.prepare("SELECT * FROM applications WHERE id = ?").get(params.id) as Application | undefined;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated: Application = {
    ...existing,
    company: body.company ?? existing.company,
    role: body.role ?? existing.role,
    job_url: body.job_url !== undefined ? body.job_url : existing.job_url,
    status: (body.status as Status) ?? existing.status,
    applied_date: body.applied_date ?? existing.applied_date,
    followup_date: body.followup_date !== undefined ? body.followup_date : existing.followup_date,
    notes: body.notes !== undefined ? body.notes : existing.notes,
    cv_file: body.cv_file !== undefined ? body.cv_file : existing.cv_file,
    cv_url: body.cv_url !== undefined ? body.cv_url : existing.cv_url,
    cl_file: body.cl_file !== undefined ? body.cl_file : existing.cl_file,
    cl_url: body.cl_url !== undefined ? body.cl_url : existing.cl_url,
    updated_at: now,
  };

  db.prepare(`
    UPDATE applications SET
      company = @company, role = @role, job_url = @job_url, status = @status,
      applied_date = @applied_date, followup_date = @followup_date, notes = @notes,
      cv_file = @cv_file, cv_url = @cv_url,
      cl_file = @cl_file, cl_url = @cl_url,
      updated_at = @updated_at
    WHERE id = @id
  `).run(updated);

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const db = getDB();
  db.prepare("DELETE FROM applications WHERE id = ?").run(params.id);
  return new NextResponse(null, { status: 204 });
}
