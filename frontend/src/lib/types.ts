// Domain models mirroring the backend responses.
//
// Prisma `Decimal` fields (balance, amount) serialize to JSON as *strings*,
// not numbers — convert at the display edge with Number()/formatters.

export type AccountType = "CASH" | "BANK" | "CREDIT_CARD" | "WALLET";
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type TxnSource = "MANUAL" | "STATEMENT_IMPORT";

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: string;
  currency: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  type: TransactionType;
  amount: string;
  description: string | null;
  occurredAt: string;
  source: TxnSource;
  createdAt: string;
}

// GET /transactions/recent — denormalized rows: each carries its account's
// name/currency and category name (or null when uncategorized), so a card can
// render standalone without joining against the accounts list.
export interface RecentTransaction extends Transaction {
  account: { name: string; currency: string };
  category: { name: string } | null;
}

// GET /transactions/summary/by-category — EXPENSE totals per category.
// `total` is a real number (summed server-side), not a Decimal string.
export interface CategorySummary {
  categoryId: string | null;
  categoryName: string;
  total: number;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
}
