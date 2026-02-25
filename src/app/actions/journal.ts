"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { journalEntries, drinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

const drinkIdSchema = z.string().min(1, "Drink ID is required").max(100);

export async function addToJournal(drinkId: string) {
  const parsed = drinkIdSchema.safeParse(drinkId);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid drink";
    return { success: false, error: msg };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to add drinks to your journal" };
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
    .insert(journalEntries)
    .values({
      id: randomUUID(),
      userId: session.user.id,
      drinkId: parsed.data,
    })
    .onConflictDoNothing({ target: [journalEntries.userId, journalEntries.drinkId] });

  revalidatePath("/drinks");
  revalidatePath("/drinks/[slug]", "page");
  revalidatePath("/wishlist");
  revalidatePath("/journal");
  return { success: true };
}

export async function removeFromJournal(drinkId: string) {
  const parsed = drinkIdSchema.safeParse(drinkId);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid drink";
    return { success: false, error: msg };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to remove drinks from your journal" };
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
    .delete(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, session.user.id),
        eq(journalEntries.drinkId, parsed.data)
      )
    );

  revalidatePath("/drinks");
  revalidatePath("/drinks/[slug]", "page");
  revalidatePath("/wishlist");
  revalidatePath("/journal");
  return { success: true };
}

const journaledAtSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export async function updateJournalDate(drinkId: string, journaledAt: string) {
  const drinkParsed = drinkIdSchema.safeParse(drinkId);
  const dateParsed = journaledAtSchema.safeParse(journaledAt);
  if (!drinkParsed.success) {
    const msg = drinkParsed.error.errors[0]?.message ?? "Invalid drink";
    return { success: false, error: msg };
  }
  if (!dateParsed.success) {
    const msg = dateParsed.error.errors[0]?.message ?? "Invalid date";
    return { success: false, error: msg };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to update journal entries" };
  }

  const date = new Date(dateParsed.data + "T12:00:00.000Z");

  await db
    .update(journalEntries)
    .set({ journaledAt: date })
    .where(
      and(
        eq(journalEntries.userId, session.user.id),
        eq(journalEntries.drinkId, drinkParsed.data)
      )
    );

  revalidatePath("/journal");
  revalidatePath("/drinks");
  revalidatePath("/drinks/[slug]", "page");
  return { success: true };
}
