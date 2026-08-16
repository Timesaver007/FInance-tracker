import { useEffect, useState } from "react";
import { getJson } from "@/lib/api";
import type {
  Account,
  RecentTransaction,
  CategorySummary,
  Category,
} from "@/lib/types";

type DashboardStatus = "idle" | "loading" | "success" | "error";

async function fetchDashboardData() {
   const [accounts, transactions, summary, categories] =
      await Promise.all([
        getJson<Account[]>("/accounts"),
        getJson<RecentTransaction[]>("/transactions/recent"),
        getJson<CategorySummary[]>("/transactions/summary/by-category"),
        getJson<Category[]>("/categories"),
      ]);

  return {
    accounts,
    transactions,
    summary,
    categories,
  };
}


export function useDashboardData() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [summary, setSummary] = useState<CategorySummary[]>([]);  
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<DashboardStatus>("idle");
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function refreshAll() {
    try {
      setIsRefreshing(true);

      const {
        accounts,
        transactions,
        summary,
        categories,
      } = await fetchDashboardData();

      setAccounts(accounts);
      setTransactions(transactions);
      setSummary(summary);
      setCategories(categories);
    } catch (err) {
      console.error("Error happened while refreshing", err);
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(()=>  {
    async function fetchData() {
      try {
        setStatus("loading");
        const {accounts, transactions, summary, categories} = await fetchDashboardData()
        setAccounts(accounts);
        setTransactions(transactions);
        setSummary(summary);
        setCategories(categories);
        setStatus("success")
      }
      catch (err) {
        setStatus("error");
        console.error("Error in fetching data", err);
      }
    }

    fetchData();
  }, [])

  return {
    accounts,
    transactions,
    summary,
    categories,
    status,
    isRefreshing,
    refreshAll
  };
}