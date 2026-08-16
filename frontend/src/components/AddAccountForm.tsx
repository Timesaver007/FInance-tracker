"use client";

import { useState } from "react";
import type { AccountType } from "@/lib/types";
import { postJson } from "@/lib/api";

interface AddAccountFormProps {
  onCreated: () => Promise<void>;
}

export default function AddAccountForm({ onCreated }: AddAccountFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("CASH");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("INR");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      await postJson("/accounts", {
        name,
        type,
        balance: Number(balance),
        currency,
      });

      await onCreated();

      setName("");
      setType("CASH");
      setBalance("");
      setCurrency("INR");
    } catch (err) {
      console.error("Failed to create account:", err);
      setError("Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel space-y-4">
      <div>
        <label className="field-label" htmlFor="name">
          Account Name
        </label>
        <input
          id="name"
          className="field-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="type">
            Type
          </label>
          <select
            id="type"
            className="field-input"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
          >
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="WALLET">Wallet</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="balance">
            Initial Balance
          </label>
          <input
            id="balance"
            className="field-input"
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="field-label" htmlFor="currency">
            Currency
          </label>
          <input
            id="currency"
            className="field-input"
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : "Add Account"}
      </button>
    </form>
  );
}
