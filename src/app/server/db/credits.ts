import { db } from "./index";
import { users, generations } from "./schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

const DAILY_FREE_LIMIT = 20;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export type ConsumeResult =
  | { ok: true; costType: "free" | "credit" | "admin"; remainingFree: number; remainingCredits: number }
  | { ok: false; reason: "daily_limit" | "no_credits"; message: string };

function isSameUTCDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export async function getOrCreateUser(userId: string) {
  const existing = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;
  const role = email && ADMIN_EMAILS.includes(email) ? "admin" : "user";

  const [created] = await db
    .insert(users)
    .values({ id: userId, email, role })
    .returning();
  return created!;
}

export async function consumeQuota(userId: string): Promise<ConsumeResult> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return { ok: false, reason: "no_credits", message: "User not found" };

  if (user.role === "admin") {
    return { ok: true, costType: "admin", remainingFree: DAILY_FREE_LIMIT, remainingCredits: user.credits };
  }

  const now = new Date();
  const dailyUsed = isSameUTCDay(user.dailyResetAt, now) ? user.dailyUsedCount : 0;

  if (dailyUsed < DAILY_FREE_LIMIT) {
    await db.update(users).set({
      dailyUsedCount: dailyUsed + 1,
      dailyResetAt: now,
      updatedAt: now,
    }).where(eq(users.id, userId));

    return {
      ok: true,
      costType: "free",
      remainingFree: DAILY_FREE_LIMIT - dailyUsed - 1,
      remainingCredits: user.credits,
    };
  }

  if (user.credits > 0) {
    await db.update(users).set({
      credits: user.credits - 1,
      updatedAt: now,
    }).where(eq(users.id, userId));

    return { ok: true, costType: "credit", remainingFree: 0, remainingCredits: user.credits - 1 };
  }

  return {
    ok: false,
    reason: "daily_limit",
    message: "Daily limit of 20 requests reached and no credits remaining",
  };
}

export async function refundQuota(userId: string, costType: "free" | "credit" | "admin") {
  if (costType === "admin") return;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return;

  if (costType === "free") {
    await db.update(users).set({
      dailyUsedCount: Math.max(0, user.dailyUsedCount - 1),
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  } else {
    await db.update(users).set({
      credits: user.credits + 1,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  }
}

export async function logGeneration(args: {
  userId: string;
  mode: "standard" | "style-ref";
  status: "succeeded" | "failed";
  costType: "free" | "credit" | "admin";
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
