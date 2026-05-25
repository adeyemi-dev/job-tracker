import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { Application, Status } from "@/lib/types";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const rows = await sql`SELECT * FROM applications WHERE id = ${params.id}`;
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0] as Application);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const body = await req.json();
  const now = new Date().toISOString();

  const rows = await sql`SELECT * FROM applications WHERE id = ${params.id}`;
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const existing = rows[0] as Application;

  const company       = body.company       ?? existing.company;
  const role          = body.role          ?? existing.role;
  const job_url       = body.job_url       !== undefined ? body.job_url       : existing.job_url;
  const status        = (body.status as Status) ?? existing.status;
  const platform      = body.platform      !== undefined ? body.platform      : existing.platform;
  const applied_date  = body.applied_date  ?? existing.applied_date;
  const followup_date = body.followup_date !== undefined ? body.followup_date : existing.followup_date;
  const notes         = body.notes         !== undefined ? body.notes         : existing.notes;
  const cv_file       = body.cv_file       !== undefined ? body.cv_file       : existing.cv_file;
  const cv_url        = body.cv_url        !== undefined ? body.cv_url        : existing.cv_url;
  const cl_file       = body.cl_file       !== undefined ? body.cl_file       : existing.cl_file;
  const cl_url        = body.cl_url        !== undefined ? body.cl_url        : existing.cl_url;

  await sql`
    UPDATE applications SET
      company = ${company}, role = ${role}, job_url = ${job_url},
      status = ${status}, platform = ${platform},
      applied_date = ${applied_date}, followup_date = ${followup_date},
      notes = ${notes}, cv_file = ${cv_file}, cv_url = ${cv_url},
      cl_file = ${cl_file}, cl_url = ${cl_url}, updated_at = ${now}
    WHERE id = ${params.id}
  `;

  const [updated] = await sql`SELECT * FROM applications WHERE id = ${params.id}`;
  return NextResponse.json(updated as Application);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  await sql`DELETE FROM applications WHERE id = ${params.id}`;
  return new NextResponse(null, { status: 204 });
}
