import type { CategorySummary } from "@/lib/types";
import { SpendingChart } from "./SpendingChart";
import { PieChartIcon } from "@/components/icons";

interface SpendingSectionProps {
  summary: CategorySummary[];
}

export default function SpendingSection({ summary }: SpendingSectionProps) {
  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">
          <PieChartIcon className="h-5 w-5 text-gray-400" />
          Spending by Category
        </h2>
      </div>

      <div className="card">
        {summary.length === 0 ? (
          <p className="muted">No spending data available.</p>
        ) : (
          <SpendingChart data={summary} />
        )}
      </div>
    </section>
  );
}
