import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Ctx) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const field = formData.get("field") as string | null; // "cv" | "cl"

  if (!file || !field) {
    return NextResponse.json({ error: "Missing file or field" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "uploads", params.id);
  await mkdir(dir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${field}_${safeName}`;
  const filePath = path.join(dir, fileName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const relativePath = `${params.id}/${fileName}`;
  return NextResponse.json({ path: relativePath });
}
