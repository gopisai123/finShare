"use client";

import { useState, useEffect } from "react";

interface Friend {
  id: string;
  clerkId?: string | null;
  name?: string | null;
  email?: string;
}

export default function SplitRow({ friend }: { friend: Friend }) {
  const clerkId = friend.clerkId || friend.id;
  const [checked, setChecked] = useState(false);
  const [method, setMethod] = useState("EQUAL");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!checked) {
      setMethod("EQUAL");
      setValue("");
    }
  }, [checked]);

  return (
    <label className="flex items-center justify-between gap-3 p-1.5 rounded hover:bg-gray-900/40">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="splitWith"
          value={clerkId}
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="w-4 h-4 rounded border-gray-800 text-green-600 focus:ring-green-500 bg-gray-950"
        />
        <div className="text-sm text-gray-200">
          {friend.name || friend.email}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          name={`splitMethod_${clerkId}`}
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          disabled={!checked}
          className="bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-gray-200"
        >
          <option value="EQUAL">Equally</option>
          <option value="EXACT">Exact</option>
          <option value="PERCENT">% of total</option>
        </select>

        <input
          name={`splitValue_${clerkId}`}
          type="text"
          placeholder={method === "PERCENT" ? "%" : "₹"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!checked || method === "EQUAL"}
          className="w-20 bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-gray-200"
        />
      </div>
    </label>
  );
}
