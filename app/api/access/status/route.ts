import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE_NAME,
  verifyAccessToken,
} from "@/lib/access";
import { getServerAuthSession } from "@/lib/auth";
import { hasPaidPurchase } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const session = await getServerAuthSession();

  if (!session?.user?.email) {
    return NextResponse.json({
      authenticated: false,
      hasAccess: false,
      hasPurchase: false,
    });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  const [hasAccess, hasPurchase] = await Promise.all([
    Promise.resolve(verifyAccessToken(accessToken, session.user.email)),
    hasPaidPurchase(session.user.email),
  ]);

  return NextResponse.json({
    authenticated: true,
    hasAccess,
    hasPurchase,
  });
}
