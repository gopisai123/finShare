"use client";

import { useActionState, useTransition } from "react";
import { addFriend, settleSplit } from "./action";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface FriendProps {
  initialFriends: {
    id: string;
    friend: {
      id: string;
      name: string | null;
      email: string;
      clerkId?: string | null;
      upiId?: string | null;
    };
  }[];
  splitsOwedToYou: {
    id: string;
    amount: number;
    userId: string;
    debtorName?: string | null;
    desc: string;
  }[];
  splitsYouOwe: {
    id: string;
    amount: number;
    creditorName: string;
    creditorUpi?: string | null;
    desc: string;
  }[];
  myUpi?: string | null;
  myName?: string | null;
}

export default function FriendsCard({
  initialFriends,
  splitsOwedToYou,
  splitsYouOwe,
  myUpi,
  myName,
}: FriendProps) {
  const [state, formAction, isPending] = useActionState(addFriend, {
    success: false,
    error: null,
  });
  const [isSettling, startSettleTransition] = useTransition();
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [upiPayload, setUpiPayload] = useState<{
    link: string;
    amount: number;
    creditorName?: string;
  } | null>(null);

  return (
    <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 flex flex-col space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Your Split Circle</h2>
        <form action={formAction} className="flex gap-2">
          <input
            name="email"
            type="email"
            placeholder="friend@email.com"
            className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-green-500"
            required
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {isPending ? "Adding..." : "Add"}
          </button>
        </form>
        {state?.error && (
          <p className="text-xs font-medium text-red-400 bg-red-950/40 border border-red-900/50 p-2 mt-2 rounded-lg">
            ⚠️ {state.error}
          </p>
        )}
      </div>

      {/* Settle Tracker Section */}
      <div className="border-t border-gray-800 pt-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">
          Pending Balances
        </h3>
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {/* Section 1: Debts OTHERS owe YOU (you are creditor) */}
          {splitsOwedToYou.map((s) => (
            <div
              key={s.id}
              className="flex justify-between items-center p-2.5 bg-gray-950/60 border border-blue-900/30 rounded-lg text-xs"
            >
              <div>
                <p className="text-blue-400 font-medium">
                  {s.debtorName || "Friend"} owes you
                </p>
                <p className="text-gray-500 text-[10px] italic">{s.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-blue-400">
                  ₹{s.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => startSettleTransition(() => settleSplit(s.id))}
                  disabled={isSettling}
                  className="bg-blue-950 text-blue-300 hover:bg-blue-900 border border-blue-800 px-2 py-1 rounded text-[10px] font-bold transition-all"
                >
                  Mark Paid
                </button>
              </div>
            </div>
          ))}

          {/* Section 2: Debts YOU owe OTHERS (you are debtor) */}
          {splitsYouOwe.map((s) => (
            <div
              key={s.id}
              className="flex justify-between items-center p-2.5 bg-gray-950/60 border border-red-900/30 rounded-lg text-xs"
            >
              <div>
                <p className="text-red-400 font-medium">
                  You owe {s.creditorName}
                </p>
                <p className="text-gray-500 text-[10px] italic">{s.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-red-400">
                  ₹{s.amount.toFixed(2)}
                </span>

                {/* Pay Button - visible to debtor only */}
                <button
                  onClick={() => startSettleTransition(() => settleSplit(s.id))}
                  disabled={isSettling}
                  className="bg-red-950 text-red-300 hover:bg-red-900 border border-red-800 px-2 py-1 rounded text-[10px] font-bold transition-all"
                >
                  Settle Up
                </button>

                {/* UPI Pay button - use creditor's UPI */}
                <button
                  onClick={() => {
                    if (!s.creditorUpi) {
                      alert(`${s.creditorName} hasn't set up UPI yet.`);
                      return;
                    }

                    const upiLink = `upi://pay?pa=${encodeURIComponent(s.creditorUpi)}&pn=${encodeURIComponent(
                      s.creditorName,
                    )}&am=${s.amount.toFixed(2)}&cu=INR`;
                    setUpiPayload({
                      link: upiLink,
                      amount: s.amount,
                      creditorName: s.creditorName,
                    });
                    setUpiModalOpen(true);
                  }}
                  className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-green-500 transition-all"
                >
                  Pay (UPI)
                </button>
              </div>
            </div>
          ))}

          {splitsOwedToYou.length === 0 && splitsYouOwe.length === 0 && (
            <p className="text-gray-500 text-xs italic py-2 text-center">
              All clear! No pending balances.
            </p>
          )}
        </div>
      </div>

      {/* UPI QR Modal */}
      {upiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-[420px] bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold">UPI Payment</h4>
              <button
                onClick={() => {
                  setUpiModalOpen(false);
                  setUpiPayload(null);
                }}
                className="text-gray-400 hover:text-white text-sm"
              >
                Close
              </button>
            </div>

            {!upiPayload?.link ? (
              <p className="text-xs text-gray-400">
                Unable to generate payment. Please check UPI ID setup.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-2 rounded">
                  <QRCodeCanvas value={upiPayload.link} size={200} />
                </div>
                <p className="text-sm text-gray-300">
                  Pay {upiPayload.creditorName} — ₹
                  {upiPayload.amount.toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(upiPayload.link)
                    }
                    className="bg-gray-800 px-3 py-1 rounded text-sm text-white"
                  >
                    Copy Link
                  </button>
                  <a
                    href={upiPayload.link}
                    className="bg-green-600 px-3 py-1 rounded text-sm text-white"
                  >
                    Open UPI App
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Circle Members Row */}
      <div className="border-t border-gray-800 pt-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          Circle Directory
        </h3>
        <div className="space-y-2">
          {initialFriends.length === 0 ? (
            <p className="text-gray-500 text-xs italic">
              Add your companions above.
            </p>
          ) : (
            initialFriends.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-2 bg-gray-950 border border-gray-800 rounded-lg"
              >
                <div className="w-7 h-7 rounded-full bg-green-950 text-green-400 flex items-center justify-center font-bold text-xs uppercase">
                  {f.friend.name?.[0] || "U"}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold">
                    {f.friend.name || "User"}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate max-w-[180px]">
                    {f.friend.email}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
