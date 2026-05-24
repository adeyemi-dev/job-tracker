import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { Interview, InterviewType } from "@/lib/types";

type Ctx = { params: { id: string; iid: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const db = getDB();
  const body = await req.json();

  const existing = db
    .prepare("SELECT * FROM interviews WHERE id = ? AND application_id = ?")
    .get(params.iid, params.id) as Interview | undefined;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated: Interview = {
    ...existing,
    type: (body.type as InterviewType) ?? existing.type,
    date: body.date ?? existing.date,
    interviewer: body.interviewer !== undefined ? body.interviewer : existing.interviewer,
    notes: body.notes !== undefined ? body.notes : existing.notes,
  };

  db.prepare(`
    UPDATE interviews SET type = @type, date = @date, interviewer = @interviewer, notes = @notes
    WHERE id = @id
  `).run(updated);

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const db = getDB();
  db.prepare("DELETE FROM interviews WHERE id = ? AND application_id = ?").run(params.iid, params.id);
  return new NextResponse(null, { status: 204 });
}
