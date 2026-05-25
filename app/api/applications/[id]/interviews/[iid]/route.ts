import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { Interview, InterviewType } from "@/lib/types";

type Ctx = { params: { id: string; iid: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const body = await req.json();

  const rows = await sql`
    SELECT * FROM interviews WHERE id = ${params.iid} AND application_id = ${params.id}
  `;
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const existing = rows[0] as Interview;

  const type        = (body.type as InterviewType) ?? existing.type;
  const date        = body.date        ?? existing.date;
  const interviewer = body.interviewer !== undefined ? body.interviewer : existing.interviewer;
  const notes       = body.notes       !== undefined ? body.notes       : existing.notes;

  await sql`
    UPDATE interviews SET type = ${type}, date = ${date},
      interviewer = ${interviewer}, notes = ${notes}
    WHERE id = ${params.iid}
  `;

  const [updated] = await sql`SELECT * FROM interviews WHERE id = ${params.iid}`;
  return NextResponse.json(updated as Interview);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  await sql`DELETE FROM interviews WHERE id = ${params.iid} AND application_id = ${params.id}`;
  return new NextResponse(null, { status: 204 });
}
