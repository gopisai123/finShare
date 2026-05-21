"use client";

import { useActionState } from "react";
import { addFriend } from "./action";

interface FriendProps {
  initialFriends: {
    id: string;
    friend: {
      name: string | null;
      email: string;
    };
  }[];
}

export default function FriendsCard({ initialFriends }: FriendProps) {
  const [state, formAction, isPending] = useActionState(addFriend, {
    success: false,
    error: null,
  });

  return (
    <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
      <h2 className="text-xl font-bold mb-4">Your Split Circle</h2>

      <form action={formAction} className="space-y-3 mb-6">
        <div className="flex gap-2">
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
        </div>

        {state?.error && (
          <p className="text-xs font-medium text-red-400 bg-red-950/40 border border-red-900/50 p-2 rounded-lg">
            ⚠️ {state.error}
          </p>
        )}
      </form>

      <h3 className="text-sm font-medium text-gray-400 mb-3">Active Friends</h3>
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {initialFriends.length === 0 ? (
          <p className="text-gray-500 text-xs">
            No friends added yet. Add someone to start splitting!
          </p>
        ) : (
          initialFriends.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 p-2 bg-gray-950 border border-gray-800 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-green-900 text-green-300 flex items-center justify-center font-bold text-sm select-none">
                {f.friend.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-sm font-semibold">{f.friend.name}</p>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">
                  {f.friend.email}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
