"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { wishlistItems, drinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

const drinkIdSchema = z.string().min(1);

export async function addToWishlist(drinkId: string) {
  const parsed = drinkIdSchema.safeParse(drinkId);
  if (!parsed.success) {
    return { success: false, error: "Invalid drink" };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to add to wishlist" };
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
    .insert(wishlistItems)
    .values({
      id: randomUUID(),
      userId: session.user.id,
      drinkId: parsed.data,
    })
    .onConflictDoNothing({ target: [wishlistItems.userId, wishlistItems.drinkId] });

  revalidatePath("/drinks");
  revalidatePath("/drinks/[slug]", "page");
  revalidatePath("/wishlist");
  return { success: true };
}

export async function removeFromWishlist(drinkId: string) {
  const parsed = drinkIdSchema.safeParse(drinkId);
  if (!parsed.success) {
    return { success: false, error: "Invalid drink" };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to update wishlist" };
  }

  await db
    .delete(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, session.user.id),
        eq(wishlistItems.drinkId, parsed.data)
      )
    );

  revalidatePath("/drinks");
  revalidatePath("/drinks/[slug]", "page");
  revalidatePath("/wishlist");
  return { success: true };
}
