"use client";

import AccountSection from "@/components/AccountSection";
import CategorySection from "@/components/CategorySection";
import SpendingSection from "@/components/SpendingSection";
import TransactionsSection from "@/components/TransactionSection";
import StatsOverview from "@/components/StatsOverview";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/context/AuthProvider";
import { LogOutIcon } from "@/components/icons";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const {
    accounts,
    transactions,
    summary,
    categories,
    status,
    isRefreshing,
    refreshAll,
  } = useDashboardData();

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="muted animate-pulse">Loading dashboard…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="form-error">Failed to load dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5">
          <h1 className="text-lg font-bold tracking-tight">
            Finance Dashboard
          </h1>

          <div className="flex items-center gap-3">
            {isRefreshing && (
              <span className="muted animate-pulse">Refreshing…</span>
            )}
            {user && (
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  {user.name
                    .split(" ")
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="hidden text-sm font-medium sm:block">
                  {user.name}
                </span>
              </div>
            )}
            <button
              onClick={() => logout()}
              className="btn-ghost"
              aria-label="Log out"
            >
              <LogOutIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        <StatsOverview accounts={accounts} summary={summary} />
        <AccountSection accounts={accounts} refreshAll={refreshAll} />
        <CategorySection refreshAll={refreshAll} />
        <TransactionsSection
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          refreshAll={refreshAll}
        />
        <SpendingSection summary={summary} />
      </main>
    </div>
  );
}
