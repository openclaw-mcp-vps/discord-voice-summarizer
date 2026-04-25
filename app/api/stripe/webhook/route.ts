import { NextResponse } from "next/server";

import { extractPurchaseFromEvent, verifyStripeWebhook } from "@/lib/stripe";
import { upsertStripePurchase } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const payload = await request.text();

  try {
    const event = verifyStripeWebhook(payload, signature);
    const purchase = extractPurchaseFromEvent(event);

    if (purchase) {
      await upsertStripePurchase({
        source: "stripe",
        email: purchase.email,
        checkoutSessionId: purchase.checkoutSessionId,
        amountTotal: purchase.amountTotal,
        currency: purchase.currency,
        eventId: event.id,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook signature verification failed",
      },
      { status: 400 },
    );
  }
}
