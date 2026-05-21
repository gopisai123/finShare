"use server";

import { db } from "../lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// 1. Update createExpense to accept prevState first
// Remove prevState here since it's a standard form action
export async function createExpense(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // This will now point to formData correctly!
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  
  if (!description || isNaN(amount)) return;

  const userFriends = await db.friendship.findMany({
    where: { userId: user.id }
  });

  const totalPeople = 1 + userFriends.length;
  const splitAmount = amount / totalPeople;

  const newExpense = await db.expense.create({
    data: {
      amount,
      description,
      paidById: user.id,
    },
  });

  if (userFriends.length > 0) {
    await db.expenseSplit.createMany({
      data: userFriends.map((f) => ({
        expenseId: newExpense.id,
        userId: f.friendId,
        amount: splitAmount,
        isPaid: false,
      })),
    });
  }

  revalidatePath("/dashboard");
}
// 2. Make sure addFriend has prevState as the FIRST argument
export async function addFriend(prevState: any, formData: FormData) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Now formData is safely the second argument, so .get() will work perfectly!
  const friendEmail = (formData.get("email") as string)?.trim().toLowerCase();
  if (!friendEmail) return { success: false, error: "Email is required" };

  const targetFriend = await db.user.findFirst({
    where: { email: friendEmail },
  });

  if (!targetFriend) {
    return { 
      success: false, 
      error: "User with this email hasn't joined finShare yet!" 
    };
  }

  if (targetFriend.clerkId === user.id) {
    return { 
      success: false, 
      error: "You can't add yourself as a friend!" 
    };
  }

  const existingFriendship = await db.friendship.findFirst({
    where: { userId: user.id, friendId: targetFriend.clerkId }
  });

  if (existingFriendship) {
    return { success: false, error: "This user is already in your circle!" };
  }

  await db.friendship.create({
    data: {
      userId: user.id,
      friendId: targetFriend.clerkId,
    },
  });

  revalidatePath("/dashboard");
  return { success: true, error: null };
}