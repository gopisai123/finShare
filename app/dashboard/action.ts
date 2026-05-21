"use server";

import { db } from "../lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createExpense(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);

  if (!description || isNaN(amount)) return;

  // Save the expense tied to the current user's clerkId
  await db.expense.create({
    data: {
      amount,
      description,
      paidById: user.id,
    },
  });

  // This tells Next.js to immediately refresh the dashboard UI with new data
  revalidatePath("/dashboard");
}
