"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { tastedItems, drinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

const drinkIdSchema = z.string().min(1);

export async function markTasted(drinkId: string) {
  const parsed = drinkIdSchema.safeParse(drinkId);
  if (!parsed.success) {
    return { success: false, error: "Invalid drink" };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to mark drinks as tasted" };
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
    .insert(tastedItems)
    .values({
      id: randomUUID(),
      userId: session.user.id,
      drinkId: parsed.data,
    })
    .onConflictDoNothing({ target: [tastedItems.userId, tastedItems.drinkId] });

  revalidatePath("/drinks");
  revalidatePath("/drinks/[slug]", "page");
  revalidatePath("/progress");
  return { success: true };
}

export async function unmarkTasted(drinkId: string) {
  const parsed = drinkIdSchema.safeParse(drinkId);
  if (!parsed.success) {
    return { success: false, error: "Invalid drink" };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to update progress" };
  }

  await db
    .delete(tastedItems)
    .where(
      and(
        eq(tastedItems.userId, session.user.id),
        eq(tastedItems.drinkId, parsed.data)
      )
    );

  revalidatePath("/drinks");
  revalidatePath("/drinks/[slug]", "page");
  revalidatePath("/progress");
  return { success: true };
}
