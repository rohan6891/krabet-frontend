export type LimboOutcome = "win" | "loss";

export type LimboRoundResult = {
  rolledMultiplier: number;
  outcome: LimboOutcome;
  payout: number;
  profit: number;
  updatedBalance: number;
};

type BetApiResponse = {
  success: boolean;
  data?: {
    mode?: "live" | "demo";
    bet?: {
      id: string;
      status: "won" | "lost" | "created" | "running" | "refunded" | "cancelled";
      payout: string;
      multiplier: string;
      bet_amount: string;
      metadata?: Record<string, unknown>;
    } | null;
    result?: {
      rolledMultiplier: number;
      outcome: LimboOutcome;
      payout: number;
      profit: number;
      updatedBalance: number;
    };
  };
};

type WalletBalanceResponse = {
  success: boolean;
  data: {
    wallets?: Array<{
      currency: string;
      availableBalance: string;
    }>;
  };
};

export type { BetApiResponse, WalletBalanceResponse };
