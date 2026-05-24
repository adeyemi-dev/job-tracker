import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { Interview, InterviewType } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const db = getDB();
  const rows = db
    .prepare("SELECT * FROM interviews WHERE application_id = ? ORDER BY date ASC, round ASC")
    .all(params.id);
  return NextResponse.json(rows as Interview[]);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const db = getDB();
  const body = await req.json();
  const now = new Date().toISOString();

  const existing = db
    .prepare("SELECT MAX(round) as max_round FROM interviews WHERE application_id = ?")
    .get(params.id) as { max_round: number | null };

  const interview: Interview = {
    id: uuidv4(),
    application_id: params.id,
    round: (existing.max_round ?? 0) + 1,
    type: (body.type as InterviewType) || "Phone",
    date: body.date,
    interviewer: body.interviewer || null,
    notes: body.notes || null,
    created_at: now,
  };

  db.prepare(`
    INSERT INTO interviews (id, application_id, round, type, date, interviewer, notes, created_at)
    VALUES (@id, @application_id, @round, @type, @date, @interviewer, @notes, @created_at)
  `).run(interview);

  return NextResponse.json(interview, { status: 201 });
}
