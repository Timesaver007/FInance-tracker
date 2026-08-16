import { useState } from "react";
import type { Account, Category, RecentTransaction } from "@/lib/types";
import TransactionCard from "./TransactionCard";
import AddTransactionForm from "@/components/AddTransactionForm";
import { PlusIcon, ReceiptIcon } from "@/components/icons";

interface TransactionsSectionProps {
  transactions: RecentTransaction[];
  accounts: Account[];
  categories: Category[];
  refreshAll: () => Promise<void>;
}

export default function TransactionsSection({
  transactions,
  accounts,
  categories,
  refreshAll,
}: TransactionsSectionProps) {
  const [showForm, setShowForm] = useState(false);

  async function handleCreated() {
    await refreshAll();
    setShowForm(false);
  }

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">
          <ReceiptIcon className="h-5 w-5 text-gray-400" />
          Recent Transactions
        </h2>

        <button className="btn-ghost" onClick={() => setShowForm(!showForm)}>
          {!showForm && <PlusIcon className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Transaction"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4">
          <AddTransactionForm
            accounts={accounts}
            categories={categories}
            onCreated={handleCreated}
          />
        </div>
      )}

      {transactions.length === 0 ? (
        <p className="muted">No recent transactions.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {transactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))}
        </div>
      )}
    </section>
  );
}
