export type DiceMode = "live" | "demo";

export type DiceOutcome = "win" | "loss";

export type DiceRoundResult = {
  roll: number;
  target: number;
  rollOver: boolean;
  outcome: DiceOutcome;
  payout: number;
  profit: number;
  updatedBalance: number;
};

export type DiceBetApiResponse = {
  success: boolean;
  data?: {
    mode?: DiceMode;
    bet?: {
      id: string;
      status: "won" | "lost" | "created" | "running" | "refunded" | "cancelled";
      payout: string;
      multiplier: string;
      bet_amount: string;
      metadata?: Record<string, unknown>;
    } | null;
    result?: DiceRoundResult;
  };
};
