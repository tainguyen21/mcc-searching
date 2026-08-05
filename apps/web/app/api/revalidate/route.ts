import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATION_SECRET;
  const suppliedSecret = request.headers.get("x-revalidation-secret");

  if (!secret || suppliedSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { storeSlug?: string };
  try {
    payload = await request.json() as { storeSlug?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.storeSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.storeSlug)) {
    return NextResponse.json({ error: "A valid storeSlug is required" }, { status: 400 });
  }

  revalidatePath(`/stores/${payload.storeSlug}`);
  return NextResponse.json({ revalidated: true, path: `/stores/${payload.storeSlug}` });
}
