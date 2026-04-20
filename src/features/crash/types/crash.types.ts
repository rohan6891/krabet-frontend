export type CrashBetStatus = "created" | "running" | "won" | "lost" | "refunded" | "cancelled";

export type CrashBetRecord = {
  id: string;
  bet_amount: string;
  status: CrashBetStatus;
  payout?: string;
  multiplier?: string;
  currency?: string;
};

export type CrashRoundBetResponse = {
  success: boolean;
  data?: {
    bet: CrashBetRecord;
    idempotent?: boolean;
  };
};

export type CashoutCrashBetResponse = {
  success: boolean;
  data?: {
    bet: CrashBetRecord;
  };
};

export type CrashLiveStateResponse = {
  success: boolean;
  data?: {
    status: "waiting" | "running" | "crashed";
    multiplier: number;
    crashedAt: number | null;
    canPlaceBet?: boolean;
    nextRoundAt?: string | null;
    startsAt?: number | null;
    crashedUntil?: string | null;
    countdownMs?: number;
    history: number[];
    growthRate?: number;
  };
};

export type CurrentCrashBetResponse = {
  success: boolean;
  data?: {
    bet: CrashBetRecord | null;
  };
};

export type CrashDemoRoundResult = {
  crashPoint: number;
  cashoutAt: number;
  outcome: "win" | "loss";
  payout: number;
  profit: number;
  updatedBalance: number;
};

export type CrashDemoBetResponse = {
  success: boolean;
  data?: {
    mode?: "demo" | "live";
    result?: CrashDemoRoundResult;
  };
};
