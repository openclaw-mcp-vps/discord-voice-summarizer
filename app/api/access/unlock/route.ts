import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE_NAME,
  buildAccessToken,
} from "@/lib/access";
import { getServerAuthSession } from "@/lib/auth";
import { hasPaidPurchase } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  const session = await getServerAuthSession();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasPurchase = await hasPaidPurchase(session.user.email);

  if (!hasPurchase) {
    return NextResponse.json(
      {
        error:
          "No completed Stripe purchase found for this email yet. Wait for the webhook and try again.",
      },
      { status: 403 },
    );
  }

  const { token, expiresAt } = buildAccessToken(
    session.user.id,
    session.user.email,
  );

  const cookieStore = await cookies();
  cookieStore.set({
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return NextResponse.json({ unlocked: true, expiresAt: expiresAt.toISOString() });
}
