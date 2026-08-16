"use client";

import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CategorySummary } from "@/lib/types";
import { formatNumber } from "@/lib/format";

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: CategorySummary }>;
};

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;

  return (
    <div className="rounded-md border border-black/10 bg-[var(--viz-surface)] px-3 py-2 text-sm shadow-sm dark:border-white/10">
      <p className="font-medium">{row.categoryName}</p>
      <p className="tabular-nums text-gray-500">{formatNumber(row.total)}</p>
    </div>
  );
}

export function SpendingChart({ data }: { data: CategorySummary[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No spending recorded yet.</p>;
  }

  // Largest spend on top; direct value labels carry the scale, so no x-axis.
  const rows = [...data].sort((a, b) => b.total - a.total);
  const height = Math.max(rows.length * 44, 160);

  return (
    <div className="viz-root">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 64, bottom: 4, left: 8 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="categoryName"
            width={120}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--viz-text-muted)", fontSize: 12 }}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "var(--viz-grid)", opacity: 0.4 }}
          />
          <Bar
            dataKey="total"
            fill="var(--viz-bar)"
            radius={[0, 4, 4, 0]}
            barSize={18}
          >
            <LabelList
              dataKey="total"
              position="right"
              formatter={(value) => formatNumber(Number(value))}
              fill="var(--foreground)"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
