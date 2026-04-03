import type { GameStatus, TileState } from "@/features/mines/constants/mines.constants";

export type MinesSessionResponse = {
  id?: string;
  sessionId?: string;
  betId?: string;
  status?: string;
  mineCount?: number;
  mine_count?: number;
  multiplier?: number;
  revealedCells?: number[];
  revealed_cells?: number[];
  minePositions?: number[];
  mine_positions?: number[];
  state?: Record<string, unknown>;
};

export type NormalizedMinesState = {
  sessionId: string;
  status: GameStatus;
  mineCount: number;
  multiplier: number;
  revealedCells: number[];
  minePositions: number[];
};

export type MineTileView = {
  index: number;
  state: TileState;
  flash: boolean;
  flashType?: TileState;
};

export type MinesHistoryEntry = {
  id: string;
  result: "Win" | "Loss" | "Cashout";
  bet: number;
  multiplier: number;
  payout: number;
};
