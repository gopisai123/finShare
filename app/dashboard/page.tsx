import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../lib/db";
import { UserButton } from "@clerk/nextjs";
import { createExpense } from "./action";
import FriendsCard from "./FriendsCard";
import CategoryChart from "./CategoryChart";
import SplitRow from "./SplitRow";

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  // Fetch user and include their logged expenses and friends
  let dbUser = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      paidExpenses: true,
      friends: {
        include: { friend: true },
      },
    },
  });

  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name:
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          "User",
        avatarUrl: clerkUser.imageUrl,
      },
      include: {
        paidExpenses: true,
        friends: {
          include: { friend: true },
        },
      },
    });
  }

  // 1. How much money friends owe you (Unpaid splits on your expenses)
  const totalOwedToYou = await db.expenseSplit.aggregate({
    where: {
      expense: { paidById: clerkUser.id },
      isPaid: false,
    },
    _sum: { amount: true },
  });

  // 2. How much money you owe other people
  const totalYouOwe = await db.expenseSplit.aggregate({
    where: {
      userId: clerkUser.id,
      isPaid: false,
    },
    _sum: { amount: true },
  });

  const owedAmount = totalOwedToYou._sum.amount || 0;
  const oweAmount = totalYouOwe._sum.amount || 0;
  // Net Balance = Debt-based only (not spending-based)
  // Formula: What others owe you - What you owe others
  const netBalance = owedAmount - oweAmount;

  // Fetch detailed splits associated with your friendships to pass down
  const rawSplitsOwedToYou = await db.expenseSplit.findMany({
    where: { expense: { paidById: clerkUser.id }, isPaid: false },
    include: { user: true, expense: true },
  });

  const rawSplitsYouOwe = await db.expenseSplit.findMany({
    where: { userId: clerkUser.id, isPaid: false },
    include: { expense: { include: { paidBy: true } } },
  });

  // Category aggregation for charts (use server-side aggregation to avoid prisma client mismatch)
  const expensesForUser = await db.expense.findMany({
    where: { paidById: clerkUser.id },
    select: { amount: true, category: true },
  });

  const categoryMap: Record<string, number> = {};
  for (const e of expensesForUser) {
    const key = (e.category as unknown as string) || "OTHER";
    categoryMap[key] = (categoryMap[key] || 0) + (e.amount || 0);
  }

  const categoriesData = Object.keys(categoryMap).map((k) => ({
    name: k,
    value: categoryMap[k],
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header section */}
      <header className="flex items-center justify-between border-b pb-4 mb-8 border-gray-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            finShare Dashboard
          </h1>
          <p className="text-gray-400">Welcome back, {dbUser.name}!</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{dbUser.email}</span>
          <UserButton />
        </div>
      </header>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400">
            Total Net Balance
          </h3>
          <p className="text-3xl font-bold text-green-500 mt-2">
            ₹{netBalance.toFixed(2)}
          </p>
        </div>
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400">You Owe</h3>
          <p className="text-3xl font-bold text-red-400 mt-2">
            ₹{oweAmount.toFixed(2)}
          </p>
        </div>
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400">You Are Owed</h3>
          <p className="text-3xl font-bold text-blue-400 mt-2">
            ₹{owedAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Sub-Grid System */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Log Form */}
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Log a New Bill</h2>
          <form action={createExpense} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Description
              </label>
              <input
                name="description"
                type="text"
                placeholder="Dinner, rent, utilities..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Category
              </label>
              <select
                name="category"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 text-sm"
                defaultValue={"OTHER"}
              >
                <option value="FOOD">Food</option>
                <option value="RENT">Rent</option>
                <option value="TRANSPORT">Transport</option>
                <option value="ENTERTAINMENT">Entertainment</option>
                <option value="UTILITIES">Utilities</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Amount (₹)
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Split Equally With:
              </label>
              <div className="space-y-2 max-h-[220px] overflow-y-auto bg-gray-950 border border-gray-800 rounded-lg p-3">
                {dbUser.friends.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Add friends on the right to split bills!
                  </p>
                ) : (
                  dbUser.friends.map((f) => (
                    <SplitRow key={f.id} friend={f.friend} />
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
            >
              Add Expense
            </button>
          </form>
        </div>

        {/* History Ledger List */}
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Recent Ledger Entries</h2>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
            {dbUser.paidExpenses?.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No transactions logged yet.
              </p>
            ) : (
              dbUser.paidExpenses?.map((exp) => (
                <div
                  key={exp.id}
                  className="flex justify-between items-center p-3 bg-gray-950 border border-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-sm">{exp.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(exp.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-bold text-green-400 text-sm">
                    ₹{exp.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Charts + Friends Management & Debt Tracking */}
        <div className="space-y-6 lg:col-span-1">
          <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              Spending by Category
            </h3>
            <div className="h-40">
              <CategoryChart data={categoriesData} />
            </div>
          </div>

          <FriendsCard
            initialFriends={dbUser.friends}
            myUpi={(dbUser as any).upiId}
            myName={dbUser.name}
            splitsOwedToYou={rawSplitsOwedToYou.map((s) => ({
              id: s.id,
              amount: s.amount,
              userId: s.userId,
              debtorName: s.user.name,
              desc: s.expense.description,
            }))}
            splitsYouOwe={rawSplitsYouOwe.map((s) => ({
              id: s.id,
              amount: s.amount,
              creditorName: s.expense.paidBy.name || "Someone",
              creditorUpi: (s.expense.paidBy as any).upiId,
              desc: s.expense.description,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
