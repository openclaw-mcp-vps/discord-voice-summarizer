import { NextResponse } from "next/server";

export function GET(request: Request): NextResponse {
  const url = new URL(request.url);
  const signInUrl = `${url.origin}/api/auth/signin/discord?callbackUrl=/dashboard`;

  return NextResponse.json({
    signInUrl,
  });
}
