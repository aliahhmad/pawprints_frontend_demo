import { NextRequest, NextResponse } from "next/server";
import { validPetitionId } from "@/lib/petition-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!validPetitionId(id))
    return NextResponse.redirect(new URL("/petitions", request.url));
  return NextResponse.redirect(new URL(`/petitions/${id}`, request.url));
}
