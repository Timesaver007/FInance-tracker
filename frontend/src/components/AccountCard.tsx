import type { Account } from "@/lib/types";
import {
  BanknoteIcon,
  CreditCardIcon,
  LandmarkIcon,
  WalletIcon,
} from "@/components/icons";
import type { SVGProps } from "react";

interface AccountCardProps {
  account: Account;
}

const TYPE_META: Record<
  Account["type"],
  { label: string; Icon: (p: SVGProps<SVGSVGElement>) => React.ReactElement; tone: string }
> = {
  CASH: {
    label: "Cash",
    Icon: BanknoteIcon,
    tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  BANK: {
    label: "Bank",
    Icon: LandmarkIcon,
    tone: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  },
  CREDIT_CARD: {
    label: "Credit Card",
    Icon: CreditCardIcon,
    tone: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
  },
  WALLET: {
    label: "Wallet",
    Icon: WalletIcon,
    tone: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  },
};

function formatCurrency(balance: string, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(Number(balance));
}

export default function AccountCard({ account }: AccountCardProps) {
  const { label, Icon, tone } = TYPE_META[account.type];

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <span className={`icon-badge ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{account.name}</h3>
          <p className="muted">{label}</p>
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold tabular-nums">
        {formatCurrency(account.balance, account.currency)}
      </p>
    </div>
  );
}
