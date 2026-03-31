"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HttpError } from "@/shared/api/http";
import { clearAuthSession, getAccessTokenFromStorage, getStoredSession } from "@/shared/utils/session";
import {
  createDeposit,
  createWithdrawal,
  fetchAuthMe,
  fetchCurrencies,
  fetchWalletBalance,
  fetchWalletTransactions,
} from "@/features/wallet/api/wallet.api";
import type {
  CurrencyRecord,
  WalletDepositCheckoutData,
  WalletEntry,
  WalletTransaction,
} from "@/features/wallet/types/wallet.types";

type WalletProfile = {
  username: string;
  avatarUrl: string | null;
  twoFactorEnabled?: boolean;
};

type WalletStats = {
  totalDeposits: string;
  totalWithdrawals: string;
  totalWagered: string;
  totalWins: string;
};

/** Unified dropdown option combining coin + network */
export type CurrencyDropdownOption = {
  /** Unique key for React / select value, e.g. "USDT-TRC20" */
  key: string;
  /** Display label, e.g. "USDT (TRC20)" */
  label: string;
  /** Fee hint badge, e.g. "⚡ Recommended", "💸 High fees" */
  badge: string;
  /** Base coin symbol */
  code: string;
  /** Network identifier */
  network: string;
  /** Provider currency for API payload */
  providerCurrency: string;
  /** Minimum deposit amount */
  minDeposit: string;
  /** Whether deposits are enabled */
  depositEnabled: boolean;
  minWithdrawal: string;
  withdrawalFee: string;
};

// ─── Network metadata for UX badges and sorting ──────────────────────
const NETWORK_META: Record<string, { badge: string; priority: number; friendlyName?: string }> = {
  TRC20:  { badge: "⚡ Recommended", priority: 1 },
  BEP20:  { badge: "Low fees", priority: 2 },
  MATIC:  { badge: "Low fees", priority: 3 },
  ARB:    { badge: "Low fees", priority: 4 },
  OP:     { badge: "Low fees", priority: 5 },
  ERC20:  { badge: "💸 High fees", priority: 10 },
};

function getNetworkFriendlyName(code: string, network: string): string {
  // For single-network coins (network === code), don't show a network label
  if (network === code) return "";
  return network;
}

function buildDropdownOptions(currencies: CurrencyRecord[]): CurrencyDropdownOption[] {
  const depositableCurrencies = currencies.filter(
    (c) => c.deposit_enabled && c.provider_available,
  );

  const options: CurrencyDropdownOption[] = depositableCurrencies.map((c) => {
    const friendlyNetwork = getNetworkFriendlyName(c.code, c.network);
    const meta = NETWORK_META[c.network] ?? { badge: "", priority: 6 };

    const label = friendlyNetwork ? `${c.code} (${friendlyNetwork})` : c.code;
    const key = friendlyNetwork ? `${c.code}-${c.network}` : c.code;

    return {
      key,
      label,
      badge: meta.badge,
      code: c.code,
      network: c.network,
      providerCurrency: c.provider_currency,
      minDeposit: c.min_deposit,
      minWithdrawal: c.min_withdrawal,
      withdrawalFee: c.withdrawal_fee,
      depositEnabled: c.deposit_enabled,
    };
  });

  // Sort: group by code, within each group sort by network priority (cheapest first)
  options.sort((a, b) => {
    if (a.code !== b.code) return a.code.localeCompare(b.code);
    const pa = NETWORK_META[a.network]?.priority ?? 6;
    const pb = NETWORK_META[b.network]?.priority ?? 6;
    return pa - pb;
  });

  return options;
}

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
  if (!wallets.length) return null;
  return wallets.find((wallet) => wallet.currency === "USDT") || wallets[0];
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getString(record: Record<string, unknown> | null, keys: string[]): string {
  if (!record) return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function buildDepositCheckoutData(data: Record<string, unknown>): WalletDepositCheckoutData {
  const payment = getRecord(data.payment);
  const deposit = getRecord(data.deposit);

  const paymentUrl =
    getString(payment, ["paymentUrl", "payment_url", "invoiceUrl", "invoice_url", "payUrl", "pay_url"]) ||
    getString(data, ["paymentUrl", "payment_url", "invoiceUrl", "invoice_url", "payUrl", "pay_url"]);

  const address =
    getString(payment, ["depositAddress", "deposit_address", "payAddress", "pay_address", "payin_address", "wallet_address"]) ||
    getString(deposit, ["depositAddress", "deposit_address", "address", "wallet_address"]);

  const network =
    getString(payment, ["network", "payCurrency", "pay_currency"]) || getString(deposit, ["network"]) || "Network pending";

  const amount = getString(deposit, ["expectedAmount", "expected_amount"]) || getString(data, ["amount"]) || "";
  const currency = getString(deposit, ["currency"]) || getString(data, ["currency"]) || "USDT";
  const qrPayload = paymentUrl || address;

  return {
    paymentUrl,
    address,
    network,
    amount,
    currency,
    qrPayload,
    providerPaymentId:
      getString(payment, ["providerPaymentId", "provider_payment_id", "paymentId", "payment_id"]) || undefined,
  };
}

export function useWalletPageData() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [currencyRecords, setCurrencyRecords] = useState<CurrencyRecord[]>([]);
  const [profile, setProfile] = useState<WalletProfile>({
    username: "Username",
    avatarUrl: null,
    twoFactorEnabled: false,
  });

  const token = useMemo(() => getAccessTokenFromStorage(), []);

  const refresh = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [balanceRes, txRes, meRes, currRes] = await Promise.all([
        fetchWalletBalance(token),
        fetchWalletTransactions(token, 200, 0),
        fetchAuthMe(token),
        fetchCurrencies(token),
      ]);

      const nextWallets = balanceRes.data.wallets || [];
      const sessionUser = getStoredSession()?.user;

      setWallets(nextWallets);
      setTransactions(txRes.data.transactions || []);
      setCurrencyRecords(currRes.data.currencies || []);
      setProfile({
        username: meRes.data.user.username || sessionUser?.username || "Username",
        avatarUrl: meRes.data.user.avatarUrl || sessionUser?.avatarUrl || null,
        twoFactorEnabled: meRes.data.user.twoFactorEnabled || (sessionUser as { twoFactorEnabled?: boolean })?.twoFactorEnabled || false,
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    function redirectToAuth() {
      clearAuthSession();
      if (!cancelled) {
        setIsAuthenticated(false);
        setIsChecking(false);
        setLoading(false);
      }
      router.replace("/auth");
    }

    async function init() {
      if (!token) {
        redirectToAuth();
        return;
      }

      try {
        await fetchAuthMe(token);
        if (cancelled) return;
        setIsAuthenticated(true);
        setIsChecking(false);
        await refresh();
      } catch (error) {
        if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
          redirectToAuth();
          return;
        }
        if (!cancelled) {
          setIsChecking(false);
          setLoading(false);
        }
      }
    }

    init();
    return () => { cancelled = true; };
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

  /** Dropdown options built from backend currency records */
  const currencyDropdownOptions = useMemo(
    () => buildDropdownOptions(currencyRecords),
    [currencyRecords],
  );

  const submitDeposit = useCallback(
    async (payload: { amount: string; currency: string; network?: string }): Promise<WalletDepositCheckoutData> => {
      if (!token) throw new Error("You must be logged in to create a deposit.");

      setSubmittingDeposit(true);
      try {
        const response = await createDeposit(token, payload, crypto.randomUUID());
        const checkoutData = buildDepositCheckoutData(response.data || {});

        if (!checkoutData.address && !checkoutData.paymentUrl) {
          throw new Error("Deposit was created, but payment details are missing.");
        }

        await refresh();
        return checkoutData;
      } catch (error) {
        if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
          clearAuthSession();
          router.replace("/auth");
        }
        throw error;
      } finally {
        setSubmittingDeposit(false);
      }
    },
    [token, refresh, router],
  );

  const submitWithdraw = useCallback(
    async (payload: { amount: string; currency: string; withdrawalAddress: string; network?: string; twoFactorCode?: string }) => {
      if (!token) return;

      setSubmittingWithdraw(true);
      try {
        await createWithdrawal(token, payload, crypto.randomUUID());
        await refresh();
      } catch (error) {
        if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
          clearAuthSession();
          router.replace("/auth");
        }
        throw error;
      } finally {
        setSubmittingWithdraw(false);
      }
    },
    [token, refresh, router],
  );

  return {
    isChecking,
    isAuthenticated,
    loading,
    submittingDeposit,
    submittingWithdraw,
    wallets,
    transactions,
    profile,
    totalBalance,
    stats,
    availableCurrencies,
    currencyDropdownOptions,
    refresh,
    submitDeposit,
    submitWithdraw,
  };
}
