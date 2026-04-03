export const DEFAULT_GRID_SIZE = 5;
export const DEFAULT_MINES = 3;
export const DEFAULT_BET = 10;
export const DEFAULT_STAKE = 10;
export const DEFAULT_CURRENCY = "USDT";
export const MAX_HISTORY = 12;
export const SESSION_STORAGE_KEY = "krabets_mines_session_id";

export const GAME_STATUS = {
  IDLE: "idle",
  PLAYING: "playing",
  WON: "won",
  LOST: "lost",
} as const;

export const TILE_STATE = {
  HIDDEN: "hidden",
  SAFE: "revealed-safe",
  MINE: "revealed-mine",
} as const;

export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];
export type TileState = (typeof TILE_STATE)[keyof typeof TILE_STATE];
