import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

type Ctx = { params: { path: string[] } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const relativePath = params.path.join("/");
  const filePath = path.join(process.cwd(), "uploads", relativePath);

  // Prevent path traversal
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!filePath.startsWith(uploadsDir)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === ".pdf" ? "application/pdf" :
      ext === ".doc" ? "application/msword" :
      ext === ".docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" :
      "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
