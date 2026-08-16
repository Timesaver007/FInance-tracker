import type { RecentTransaction } from "@/lib/types";
import type { SVGProps } from "react";
import {
  ArrowDownLeftIcon,
  ArrowLeftRightIcon,
  ArrowUpRightIcon,
} from "@/components/icons";

interface TransactionCardProps {
  transaction: RecentTransaction;
}

const TYPE_META: Record<
  RecentTransaction["type"],
  {
    Icon: (p: SVGProps<SVGSVGElement>) => React.ReactElement;
    badge: string;
    amount: string;
    sign: string;
  }
> = {
  INCOME: {
    Icon: ArrowDownLeftIcon,
    badge: "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400",
    amount: "text-green-600 dark:text-green-500",
    sign: "+",
  },
  EXPENSE: {
    Icon: ArrowUpRightIcon,
    badge: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
    amount: "text-red-600 dark:text-red-500",
    sign: "-",
  },
  TRANSFER: {
    Icon: ArrowLeftRightIcon,
    badge: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400",
    amount: "text-gray-600 dark:text-gray-300",
    sign: "-",
  },
};

function formatCurrency(amount: string, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const { Icon, badge, amount, sign } = TYPE_META[transaction.type];

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <span className={`icon-badge ${badge}`}>
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium">
          {transaction.description ?? "(no description)"}
        </h3>
        <p className="muted mt-0.5 truncate">
          {transaction.account.name} ·{" "}
          {transaction.category?.name ?? "Uncategorized"} ·{" "}
          {formatDate(transaction.occurredAt)}
        </p>
      </div>

      <span className={`shrink-0 font-semibold tabular-nums ${amount}`}>
        {sign}
        {formatCurrency(transaction.amount, transaction.account.currency)}
      </span>
    </div>
  );
}
