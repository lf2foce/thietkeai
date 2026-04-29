import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/server/db";
import { users } from "@/app/server/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const QUOTA_LIMITS = { free: 20, premium: 1000 } as const;

function getPeriodStart(plan: "free" | "premium"): Date {
  const now = new Date();
  if (plan === "free") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return NextResponse.json({ unlimited: false, used: 0, limit: QUOTA_LIMITS.free, remaining: QUOTA_LIMITS.free, plan: "free" });
  }

  if (user.role === "admin") {
    return NextResponse.json({ unlimited: true, used: 0, limit: null, remaining: null, plan: "admin" });
  }

  const limit = QUOTA_LIMITS[user.plan];
  const periodExpired = user.quotaResetAt < getPeriodStart(user.plan);
  const used = periodExpired ? 0 : user.quotaUsed;
  const remaining = Math.max(0, limit - used);

  return NextResponse.json({ unlimited: false, used, limit, remaining, plan: user.plan });
}
