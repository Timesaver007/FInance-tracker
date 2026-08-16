import type { Account, CategorySummary } from "@/lib/types";
import { LandmarkIcon, TrendingDownIcon, WalletIcon } from "@/components/icons";

interface StatsOverviewProps {
  accounts: Account[];
  summary: CategorySummary[];
}

// Note: balances/totals are summed across accounts regardless of currency —
// a deliberate simplification. Display in the first account's currency.
function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function StatsOverview({
  accounts,
  summary,
}: StatsOverviewProps) {
  const currency = accounts[0]?.currency ?? "INR";
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalSpending = summary.reduce((sum, s) => sum + s.total, 0);

  const stats = [
    {
      label: "Total Balance",
      value: formatMoney(totalBalance, currency),
      icon: WalletIcon,
      tone: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    },
    {
      label: "Accounts",
      value: String(accounts.length),
      icon: LandmarkIcon,
      tone: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
    },
    {
      label: "Total Spending",
      value: formatMoney(totalSpending, currency),
      icon: TrendingDownIcon,
      tone: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map(({ label, value, icon: IconCmp, tone }) => (
        <div key={label} className="card flex items-center gap-4">
          <span className={`icon-badge ${tone}`}>
            <IconCmp className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="muted">{label}</p>
            <p className="truncate text-2xl font-bold tabular-nums">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
