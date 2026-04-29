import { db } from "./index";
import { users, generations } from "./schema";
import { eq, sql } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const QUOTA_LIMITS = {
  free: 20,      // per day
  premium: 1000, // per month
} as const;

export type ConsumeResult =
  | { ok: true; costType: "quota" | "admin"; remaining: number }
  | { ok: false; reason: "no_quota"; message: string };

function getPeriodStart(plan: "free" | "premium"): Date {
  const now = new Date();
  if (plan === "free") {
    // Start of today (UTC)
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  // Start of current month (UTC)
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function isExpired(quotaResetAt: Date, plan: "free" | "premium"): boolean {
  return quotaResetAt < getPeriodStart(plan);
}

export async function getOrCreateUser(userId: string, emailHint?: string | null) {
  const existing = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (existing) return existing;

  const email = emailHint ?? (await currentUser())?.emailAddresses[0]?.emailAddress ?? null;
  const role = email && ADMIN_EMAILS.includes(email) ? "admin" : "user";

  const [created] = await db
    .insert(users)
    .values({ id: userId, email, role })
    .onConflictDoNothing()
    .returning();

  // If another concurrent request already inserted, fetch the existing row
  if (!created) {
    return (await db.query.users.findFirst({ where: eq(users.id, userId) }))!;
  }
  return created;
}


export async function consumeQuota(userId: string, cost = 1): Promise<ConsumeResult> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return { ok: false, reason: "no_quota", message: "User not found" };

  if (user.role === "admin") {
    return { ok: true, costType: "admin", remaining: Infinity };
  }

  const limit = QUOTA_LIMITS[user.plan];
  const now = new Date();
  const periodExpired = isExpired(user.quotaResetAt, user.plan);
  const currentUsed = periodExpired ? 0 : user.quotaUsed;

  if (currentUsed + cost > limit) {
    const period = user.plan === "free" ? "day" : "month";
    return {
      ok: false,
      reason: "no_quota",
      message: `Không đủ lượt (cần ${cost}, còn ${limit - currentUsed}/${limit} ${period})`,
    };
  }

  const periodStart = getPeriodStart(user.plan);

  await db.update(users).set({
    quotaUsed: periodExpired ? cost : sql`${users.quotaUsed} + ${cost}`,
    quotaResetAt: periodExpired ? periodStart : user.quotaResetAt,
    updatedAt: now,
  }).where(eq(users.id, userId));

  return { ok: true, costType: "quota", remaining: limit - currentUsed - cost };
}

export async function refundQuota(userId: string, costType: "quota" | "admin", cost = 1) {
  if (costType === "admin") return;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return;

  await db.update(users).set({
    quotaUsed: Math.max(0, user.quotaUsed - cost),
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
}

export async function logGeneration(args: {
  userId: string;
  mode: "standard" | "style-ref";
  status: "succeeded" | "failed";
  costType: "quota" | "admin";
  roomType?: string;
  theme?: string;
}) {
  await db.insert(generations).values({
    userId: args.userId,
    mode: args.mode,
    status: args.status,
    costType: args.costType,
    roomType: args.roomType,
    theme: args.theme,
  });
}
