import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { Interview, InterviewType } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const rows = await sql`
    SELECT * FROM interviews
    WHERE application_id = ${params.id}
    ORDER BY date ASC, round ASC
  `;
  return NextResponse.json(rows as Interview[]);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const body = await req.json();
  const now = new Date().toISOString();
  const id = uuidv4();

  const maxRows = (await sql`
    SELECT COALESCE(MAX(round), 0) as max_round
    FROM interviews WHERE application_id = ${params.id}
  `) as { max_round: number }[];
  const round = Number(maxRows[0].max_round) + 1;

  await sql`
    INSERT INTO interviews (id, application_id, round, type, date, interviewer, notes, created_at)
    VALUES (${id}, ${params.id}, ${round}, ${(body.type as InterviewType) || "Phone"},
            ${body.date}, ${body.interviewer || null}, ${body.notes || null}, ${now})
  `;

  const [interview] = (await sql`SELECT * FROM interviews WHERE id = ${id}`) as Interview[];
  return NextResponse.json(interview, { status: 201 });
}
