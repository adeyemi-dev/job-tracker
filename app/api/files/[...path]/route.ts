import { NextResponse } from "next/server";

// Files are now stored in Vercel Blob and accessed via their own CDN URLs.
export function GET() {
  return NextResponse.json({ error: "Files are served from their blob storage URLs." }, { status: 410 });
}
