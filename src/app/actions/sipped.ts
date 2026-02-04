"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { sippedItems, drinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

const drinkIdSchema = z.string().min(1, "Drink ID is required").max(100);

export async function markSipped(drinkId: string) {
  const parsed = drinkIdSchema.safeParse(drinkId);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid drink";
    return { success: false, error: msg };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to mark drinks as sipped" };
  }

  const [existing] = await db
    .select()
    .from(drinks)
    .where(eq(drinks.id, parsed.data))
    .limit(1);
  if (!existing) {
    return { success: false, error: "Drink not found" };
  }

  await db
    .insert(sippedItems)
    .values({
      id: randomUUID(),
      userId: session.user.id,
      drinkId: parsed.data,
    })
    .onConflictDoNothing({ target: [sippedItems.userId, sippedItems.drinkId] });

  revalidatePath("/drinks");
  revalidatePath("/drinks/[slug]", "page");
  revalidatePath("/wishlist");
  revalidatePath("/sips");
  return { success: true };
}

export async function unmarkSipped(drinkId: string) {
  const parsed = drinkIdSchema.safeParse(drinkId);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid drink";
    return { success: false, error: msg };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to remove drinks from your sip list" };
  }

  const [existing] = await db
    .select()
    .from(drinks)
    .where(eq(drinks.id, parsed.data))
    .limit(1);
  if (!existing) {
    return { success: false, error: "Drink not found" };
  }

  await db
    .delete(sippedItems)
    .where(
      and(
        eq(sippedItems.userId, session.user.id),
        eq(sippedItems.drinkId, parsed.data)
      )
    );

  revalidatePath("/drinks");
  revalidatePath("/drinks/[slug]", "page");
  revalidatePath("/wishlist");
  revalidatePath("/sips");
  return { success: true };
}
