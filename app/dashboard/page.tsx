import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
// Look for your db import near the top and change it to:
import { db } from "../lib/db";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  // 1. Fetch the authenticated user details from Clerk
  const clerkUser = await currentUser();

  // If for some reason they aren't logged in, kick them back to sign-in
  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Extract the primary email address
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const name =
    `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User";

  // 2. Lazy Sync: Check if this user already exists in our Neon database
  let dbUser = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  // 3. If they don't exist in Neon yet, create their record right now!
  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        clerkId: clerkUser.id,
        email: email,
        name: name,
        avatarUrl: clerkUser.imageUrl,
      },
    });
    console.log("New user synchronized to Neon database:", dbUser.email);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {/* Header Row */}
      <header className="flex items-center justify-between border-b pb-4 mb-8 border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            finShare Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Welcome back, {dbUser.name}!
          </p>
        </div>
        {/* Clerk's built-in profile dropdown widget */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {dbUser.email}
          </span>
          <UserButton />
        </div>
      </header>

      {/* Main Dashboard Grid Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Balance
          </h3>
          <p className="text-2xl font-bold text-green-600 mt-2">$0.00</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            You Owe
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            $0.00
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            You Are Owed
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            $0.00
          </p>
        </div>
      </div>
    </div>
  );
}
