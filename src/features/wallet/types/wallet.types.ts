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

export type WalletDepositCheckoutData = {
  paymentUrl: string;
  address: string;
  network: string;
  amount: string;
  currency: string;
  qrPayload: string;
  providerPaymentId?: string;
};

export type WalletDepositResponse = {
  success: boolean;
  data: {
    payment?: Record<string, unknown>;
    deposit?: Record<string, unknown>;
  } & Record<string, unknown>;
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

export type CurrencyRecord = {
  code: string;
  network: string;
  provider_currency: string;
  min_deposit: string;
  min_withdrawal: string;
  provider_min_deposit: string | null;
  provider_available: boolean;
  withdrawal_fee: string;
  deposit_enabled: boolean;
  withdraw_enabled: boolean;
};

export type CurrenciesResponse = {
  success: boolean;
  data: {
    currencies: CurrencyRecord[];
  };
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
