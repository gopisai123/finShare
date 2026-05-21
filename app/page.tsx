import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LandingPage() {
  // Check if a user session exists in Clerk
  const { userId } = await auth();

  // If they are logged in, send them straight to the dashboard!
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative ambient glow background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative text-center max-w-2xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 px-4 py-1.5 rounded-full text-sm text-green-400 font-medium mb-2">
          ✨ Welcome to the future of splitting expenses
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          finShare
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-md mx-auto leading-relaxed">
          The ultra-minimal workspace to split bills, settle debts, and log
          shared balances seamlessly with friends.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-green-900/20 active:scale-[0.98]"
          >
            Open App Dashboard
          </Link>
          <a
            href="https://github.com/gopisai123/finShare"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium px-6 py-3.5 rounded-xl border border-gray-800 transition-colors"
          >
            View Source Code
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-xs text-gray-600 tracking-wider">
        © {new Date().getFullYear()} FINSHARE • SHARING SIMPLIFIED
      </footer>
    </div>
  );
}
