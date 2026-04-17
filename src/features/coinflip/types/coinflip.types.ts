export type CoinSide = "heads" | "tails";

export type CoinflipMode = "live" | "demo";

export type CoinflipOutcome = "win" | "loss";

export type CoinflipRoundResult = {
  outcomeSide: CoinSide;
  outcome: CoinflipOutcome;
  payout: number;
  profit: number;
  updatedBalance: number;
};

export type CoinflipBetApiResponse = {
  success: boolean;
  data?: {
    mode?: CoinflipMode;
    bet?: {
      id: string;
      status: "won" | "lost" | "created" | "running" | "refunded" | "cancelled";
      payout: string;
      multiplier: string;
      bet_amount: string;
      metadata?: Record<string, unknown>;
    } | null;
    result?: {
      outcomeSide: CoinSide;
      outcome: CoinflipOutcome;
      payout: number;
      profit: number;
      updatedBalance: number;
    };
  };
};
