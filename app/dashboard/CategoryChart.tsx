"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface Props {
  data: { name: string; value: number }[];
}

const COLORS = [
  "#16a34a",
  "#ef4444",
  "#3b82f6",
  "#f59e0b",
  "#a78bfa",
  "#94a3b8",
];

export default function CategoryChart({ data }: Props) {
  const filtered = data.filter((d) => d.value > 0);
  const payload = filtered.length ? filtered : [{ name: "No data", value: 1 }];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          dataKey="value"
          data={payload}
          innerRadius={40}
          outerRadius={70}
          paddingAngle={4}
          label={(entry) => `${entry.name}` as any}
        >
          {payload.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(val: any) => `₹${parseFloat(val).toFixed(2)}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}
