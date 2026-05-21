"use server";

import { db } from "../lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
// 1. Create and divide a bill with unequal split support (Splitwise-style)
export async function createExpense(formData: FormData) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const description = (formData.get("description") as string) || "";
  const totalAmount = parseFloat((formData.get("amount") as string) || "0");
  const category = (formData.get("category") as string) || "OTHER";
  const splitWithIds = formData.getAll("splitWith") as string[]; // clerkIds of friends only

  if (!description || isNaN(totalAmount) || totalAmount <= 0) {
    throw new Error("Invalid input arguments");
  }

  const expense = await db.expense.create({
    data: {
      description,
      amount: totalAmount,
      paidById: clerkUser.id,
      category: category as any,
    },
  });

  // Personal expense: no splits needed, no balance impact
  if (splitWithIds.length === 0) {
    revalidatePath("/dashboard");
    return;
  }

  // Shared expense: create splits for friends ONLY
  // Total participants = friends + current user (payer)
  const totalParticipants = splitWithIds.length + 1;

  // Parse split methods and values for each friend
  type Parsed = { id: string; method: string; val?: number };
  const parsed: Parsed[] = splitWithIds.map((id) => {
    const method = (formData.get(`splitMethod_${id}`) as string) || "EQUAL";
    const rawVal = (formData.get(`splitValue_${id}`) as string) || "";
    const val = rawVal === "" ? undefined : parseFloat(rawVal);
    return { id, method, val };
  });

  // Calculate totals for validation
  let exactSum = 0;
  let percentSum = 0;
  let percentAmountTotal = 0;
  let equalCount = 0;

  for (const p of parsed) {
    if (p.method === "EXACT" && typeof p.val === "number") {
      exactSum += p.val;
    } else if (p.method === "PERCENT" && typeof p.val === "number") {
      percentSum += p.val;
    } else {
      equalCount += 1;
    }
  }

  percentAmountTotal = (percentSum / 100) * totalAmount;
  const remaining = totalAmount - exactSum - percentAmountTotal;
  if (remaining < -0.01) {
    throw new Error("Split values exceed total amount");
  }

  const equalShare = equalCount > 0 ? remaining / equalCount : 0;

  // Create ExpenseSplit entries for EACH FRIEND (not for the payer)
  // This tracks how much each friend owes the payer
  await Promise.all(
    parsed.map(async (p) => {
      let amount = 0;
      let percent: number | undefined = undefined;
      let exact: number | undefined = undefined;

      if (p.method === "EXACT") {
        exact = p.val ?? 0;
        amount = exact;
      } else if (p.method === "PERCENT") {
        percent = p.val ?? 0;
        amount = ((percent ?? 0) / 100) * totalAmount;
      } else {
        amount = equalShare;
      }

      // Create split: friend owes payer this amount
      await db.expenseSplit.create({
        data: {
          expenseId: expense.id,
          userId: p.id, // friend's clerkId
          amount: parseFloat(amount.toFixed(2)), // what they owe
          isPaid: false,
          method: p.method as any,
          percent: percent ?? null,
          exact: exact ?? null,
        },
      });
    }),
  );

  revalidatePath("/dashboard");
}

// 2. Add Friend Action (ensure we store friendship using clerkId references)
export async function addFriend(prevState: any, formData: FormData) {
  const clerkUser = await currentUser();
  if (!clerkUser) return { success: false, error: "Authentication failed" };

  const email = formData.get("email") as string;
  if (!email)
    return { success: false, error: "Please provide an email address" };

  const targetUser = await db.user.findFirst({ where: { email } });
  if (!targetUser) {
    return {
      success: false,
      error:
        "This user hasn't initialized their finShare dashboard yet. Ask them to log in once first!",
    };
  }

  if (targetUser.clerkId === clerkUser.id) {
    return { success: false, error: "You cannot add yourself as a friend" };
  }

  const identity = await db.user.findFirst({
    where: { clerkId: clerkUser.id },
  });
  if (!identity) return { success: false, error: "User out of sync" };

  const linkExists = await db.friendship.findFirst({
    where: { userId: identity.clerkId, friendId: targetUser.clerkId },
  });

  if (linkExists)
    return { success: false, error: "This user is already in your circle" };

  await db.friendship.create({
    data: { userId: identity.clerkId, friendId: targetUser.clerkId },
  });

  revalidatePath("/dashboard");
  return { success: true, error: null };
}

// 3. Settle debts securely
export async function settleSplit(splitId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  await db.expenseSplit.update({
    where: { id: splitId },
    data: { isPaid: true },
  });

  revalidatePath("/dashboard");
}
