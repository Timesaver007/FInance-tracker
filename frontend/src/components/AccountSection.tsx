import type { Account } from "@/lib/types";
import AccountCard from "@/components/AccountCard";
import AddAccountForm from "@/components/AddAccountForm";
import { PlusIcon, WalletIcon } from "@/components/icons";
import { useState } from "react";

interface AccountSectionProps {
  accounts: Account[];
  refreshAll: () => Promise<void>;
}

export default function AccountSection({
  accounts,
  refreshAll,
}: AccountSectionProps) {
  const [showForm, setShowForm] = useState(false);

  async function handleCreated() {
    await refreshAll();
    setShowForm(false);
  }

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">
          <WalletIcon className="h-5 w-5 text-gray-400" />
          Accounts
        </h2>

        <button className="btn-ghost" onClick={() => setShowForm(!showForm)}>
          {!showForm && <PlusIcon className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Account"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4">
          <AddAccountForm onCreated={handleCreated} />
        </div>
      )}

      {accounts.length === 0 ? (
        <p className="muted">No accounts yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </section>
  );
}
