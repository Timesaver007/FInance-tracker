"use client";

import { useState } from "react";
import { postJson } from "@/lib/api";
import type { Account, Category, TransactionType } from "@/lib/types";

interface AddTransactionFormProps {
  accounts: Account[];
  categories: Category[];
  onCreated: () => Promise<void>;
}

export default function AddTransactionForm({
  accounts,
  categories,
  onCreated,
}: AddTransactionFormProps) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    () => new Date().toISOString().slice(0, 10),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A transaction needs an account. Guard rather than render a broken <select>.
  if (accounts.length === 0) {
    return (
      <p className="panel muted">
        Create an account before adding a transaction.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      // Omit the optional fields when empty: categoryId="" would fail IsUUID,
      // and an empty description is noise. occurredAt is a "YYYY-MM-DD" from the
      // date input — widen it to a full ISO string for IsDateString.
      const body: Record<string, unknown> = {
        accountId,
        type,
        amount: Number(amount),
        occurredAt: new Date(occurredAt).toISOString(),
      };
      if (categoryId) body.categoryId = categoryId;
      if (description.trim()) body.description = description.trim();

      await postJson("/transactions", body);

      await onCreated();
    } catch (err) {
      console.error("Failed to create transaction:", err);
      setError("Failed to create transaction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="txn-account">
            Account
          </label>
          <select
            id="txn-account"
            className="field-input"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="txn-type">
            Type
          </label>
          <select
            id="txn-type"
            className="field-input"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
          >
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="txn-amount">
            Amount
          </label>
          <input
            id="txn-amount"
            className="field-input"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="field-label" htmlFor="txn-category">
            Category
          </label>
          <select
            id="txn-category"
            className="field-input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="txn-description">
            Description
          </label>
          <input
            id="txn-description"
            className="field-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="txn-date">
            Date
          </label>
          <input
            id="txn-date"
            className="field-input"
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : "Add Transaction"}
      </button>
    </form>
  );
}
