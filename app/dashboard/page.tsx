import { cookies } from "next/headers";

import { DashboardClient } from "@/components/DashboardClient";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "@/lib/access";
import { getServerAuthSession } from "@/lib/auth";
import { hasPaidPurchase } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  const cookieStore = await cookies();

  const email = session?.user?.email || "";
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const hasAccess = verifyAccessToken(token, email);
  const purchaseDetected = email ? await hasPaidPurchase(email) : false;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-6 pb-16 pt-10 sm:px-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-slate-100">
          Discord Voice Summary Workspace
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">
          Manage monitored channels, upload or ingest recordings, and generate meeting
          notes with action items for your team.
        </p>
      </div>

      <DashboardClient
        user={
          session?.user
            ? {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
              }
            : null
        }
        hasAccess={hasAccess}
        purchaseDetected={purchaseDetected}
        paymentLink={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
      />
    </main>
  );
}
