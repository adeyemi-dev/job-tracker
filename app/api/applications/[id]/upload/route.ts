import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "File uploads are not configured. Add a Vercel Blob store or use a URL instead." },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const field = formData.get("field") as string | null;

  if (!file || !field) {
    return NextResponse.json({ error: "Missing file or field" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`${params.id}/${field}_${safeName}`, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
