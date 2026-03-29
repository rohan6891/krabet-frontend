"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessTokenFromStorage, getStoredSession } from "@/shared/utils/session";
import {
  createDeposit,
  createWithdrawal,
  fetchAuthMe,
  fetchWalletBalance,
  fetchWalletTransactions,
} from "@/features/wallet/api/wallet.api";
import type { WalletEntry, WalletTransaction } from "@/features/wallet/types/wallet.types";

type WalletProfile = {
  username: string;
  avatarUrl: string | null;
};

type WalletStats = {
  totalDeposits: string;
  totalWithdrawals: string;
  totalWagered: string;
  totalWins: string;
};

function toNumber(value: string | number | null | undefined): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function sumByType(transactions: WalletTransaction[], type: WalletTransaction["type"]): string {
  const sum = transactions
    .filter((tx) => tx.type === type)
    .reduce((acc, tx) => acc + toNumber(tx.amount), 0);

  return sum.toFixed(2);
}

function getPreferredWallet(wallets: WalletEntry[]): WalletEntry | null {
  if (!wallets.length) {
    return null;
  }

  return wallets.find((wallet) => wallet.currency === "USDT") || wallets[0];
}

export function useWalletPageData() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [profile, setProfile] = useState<WalletProfile>({
    username: "Username",
    avatarUrl: null,
  });

  const token = useMemo(() => getAccessTokenFromStorage(), []);

  const refresh = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const [balanceRes, txRes, meRes] = await Promise.all([
        fetchWalletBalance(token),
        fetchWalletTransactions(token, 200, 0),
        fetchAuthMe(token),
      ]);

      const nextWallets = balanceRes.data.wallets || [];
      const sessionUser = getStoredSession()?.user;

      setWallets(nextWallets);
      setTransactions(txRes.data.transactions || []);
      setProfile({
        username: meRes.data.user.username || sessionUser?.username || "Username",
        avatarUrl: meRes.data.user.avatarUrl || sessionUser?.avatarUrl || null,
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setIsChecking(false);
      router.replace("/auth");
      return;
    }

    setIsChecking(false);
    refresh().catch(() => {
      setLoading(false);
    });
  }, [router, token, refresh]);

  const preferredWallet = useMemo(() => getPreferredWallet(wallets), [wallets]);
  const totalBalance = preferredWallet?.availableBalance || "0.00";

  const stats = useMemo<WalletStats>(
    () => ({
      totalDeposits: sumByType(transactions, "deposit"),
      totalWithdrawals: sumByType(transactions, "withdrawal"),
      totalWagered: sumByType(transactions, "bet"),
      totalWins: sumByType(transactions, "win"),
    }),
    [transactions],
  );

  const availableCurrencies = useMemo(() => wallets.map((wallet) => wallet.currency), [wallets]);

  const submitDeposit = useCallback(
    async (payload: { amount: string; currency: string; network?: string }) => {
      if (!token) {
        return;
      }

      setSubmittingDeposit(true);
      try {
        await createDeposit(token, payload, crypto.randomUUID());
        await refresh();
      } finally {
        setSubmittingDeposit(false);
      }
    },
    [token, refresh],
  );

  const submitWithdraw = useCallback(
    async (payload: { amount: string; currency: string; withdrawalAddress: string; network?: string }) => {
      if (!token) {
        return;
      }

      setSubmittingWithdraw(true);
      try {
        await createWithdrawal(token, payload, crypto.randomUUID());
        await refresh();
      } finally {
        setSubmittingWithdraw(false);
      }
    },
    [token, refresh],
  );

  return {
    isChecking,
    loading,
    submittingDeposit,
    submittingWithdraw,
    wallets,
    transactions,
    profile,
    totalBalance,
    stats,
    availableCurrencies,
    refresh,
    submitDeposit,
    submitWithdraw,
  };
}
