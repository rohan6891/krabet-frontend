export type WalletEntry = {
  id: string;
  currency: string;
  balance: string;
  lockedBalance: string;
  availableBalance: string;
};

export type WalletBalanceResponse = {
  success: boolean;
  data: {
    wallets?: WalletEntry[];
    wallet?: WalletEntry | null;
  };
};

export type WalletTransaction = {
  id: string;
  type: "deposit" | "withdrawal" | "bet" | "win" | "refund" | "adjustment";
  amount: string;
  balance_before: string;
  balance_after: string;
  reference_type: string;
  reference_id: string;
  metadata: Record<string, unknown>;
  status: "pending" | "confirmed" | "failed";
  created_at: string;
};

export type WalletTransactionsResponse = {
  success: boolean;
  data: {
    transactions: WalletTransaction[];
  };
};

export type WalletDepositPayload = {
  currency: string;
  amount: string;
  network?: string;
};

export type WalletWithdrawPayload = {
  currency: string;
  amount: string;
  withdrawalAddress: string;
  network?: string;
};

export type WalletActionResponse = {
  success: boolean;
  data: Record<string, unknown>;
};

export type AuthMeResponse = {
  success: boolean;
  data: {
    user: {
      username: string;
      avatarUrl?: string | null;
    };
  };
};
