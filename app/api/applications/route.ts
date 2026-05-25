import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { Application, Status } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const rows = status
    ? await sql`SELECT * FROM applications WHERE status = ${status} ORDER BY applied_date DESC`
    : await sql`SELECT * FROM applications ORDER BY applied_date DESC`;
  return NextResponse.json(rows as Application[]);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const now = new Date().toISOString();
  const id = uuidv4();

  await sql`
    INSERT INTO applications
      (id, company, role, job_url, status, platform, applied_date, followup_date,
       notes, cv_file, cv_url, cl_file, cl_url, created_at, updated_at)
    VALUES
      (${id}, ${body.company}, ${body.role}, ${body.job_url || null},
       ${(body.status as Status) || "Applied"}, ${body.platform || null},
       ${body.applied_date || now.slice(0, 10)}, ${body.followup_date || null},
       ${body.notes || null}, ${body.cv_file || null}, ${body.cv_url || null},
       ${body.cl_file || null}, ${body.cl_url || null}, ${now}, ${now})
  `;

  const [app] = await sql`SELECT * FROM applications WHERE id = ${id}`;
  return NextResponse.json(app as Application, { status: 201 });
}
