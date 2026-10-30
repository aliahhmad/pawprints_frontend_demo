import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to") || "/";
  if (["/create", "/about", "/committees", "/profile"].includes(to))
    return NextResponse.redirect(new URL(to, request.url));
  const review = to.match(/^\/review\/([1-9]\d*)$/);
  if (review)
    return NextResponse.redirect(
      new URL(`/petitions/${review[1]}`, request.url),
    );
  return NextResponse.redirect(new URL("/", request.url));
}
