import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const rows = await sql`SELECT COUNT(*) as count FROM users`;
  const count = Number(rows[0].count);
  return NextResponse.json({ hasUsers: count > 0 });
}

export async function POST(req: Request) {
  const rows = await sql`SELECT COUNT(*) as count FROM users`;
  const count = Number(rows[0].count);
  if (count > 0) {
    return NextResponse.json({ error: "An account already exists." }, { status: 400 });
  }

  const { name, email, password } = await req.json();
  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();
  const id = uuidv4();

  await sql`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (${id}, ${name.trim()}, ${email.trim().toLowerCase()}, ${hash}, ${now})
  `;

  return NextResponse.json({ ok: true });
}
