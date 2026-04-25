import Stripe from "stripe";

interface StripePurchaseEvent {
  email: string;
  checkoutSessionId?: string;
  amountTotal?: number | null;
  currency?: string | null;
}

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
  return new Stripe(key);
}

export function verifyStripeWebhook(
  payload: string,
  signature: string,
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export function extractPurchaseFromEvent(
  event: Stripe.Event,
): StripePurchaseEvent | null {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return null;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const email = session.customer_details?.email || session.customer_email;

  if (!email) {
    return null;
  }

  return {
    email: email.trim().toLowerCase(),
    checkoutSessionId: session.id,
    amountTotal: session.amount_total,
    currency: session.currency,
  };
}
