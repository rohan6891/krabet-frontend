import { GAME_STATUS, TILE_STATE, type GameStatus, type TileState } from "@/features/mines/constants/mines.constants";
import type { MinesSessionResponse, NormalizedMinesState } from "@/features/mines/types/mines.types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatMoney(value: string | number): string {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return safe.toFixed(2);
}

export function formatMultiplier(value: string | number): string {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 1;
  return `x${safe.toFixed(2)}`;
}

function normalizeStatus(status?: string): GameStatus {
  if (status === "running") return GAME_STATUS.PLAYING;
  if (status === "won") return GAME_STATUS.WON;
  if (status === "lost") return GAME_STATUS.LOST;
  if (status === GAME_STATUS.PLAYING) return GAME_STATUS.PLAYING;
  if (status === GAME_STATUS.WON) return GAME_STATUS.WON;
  if (status === GAME_STATUS.LOST) return GAME_STATUS.LOST;
  return GAME_STATUS.IDLE;
}

function normalizeIndexArray(values: unknown): number[] {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0);
}

export function normalizeMinesState(payload: MinesSessionResponse): NormalizedMinesState {
  const base = (payload?.state as MinesSessionResponse | undefined) ?? payload ?? {};

  return {
    sessionId: String(base.sessionId || base.id || ""),
    status: normalizeStatus(base.status),
    mineCount: Number(base.mine_count ?? base.mineCount ?? 3),
    multiplier: Number(base.multiplier ?? 1),
    revealedCells: normalizeIndexArray(base.revealed_cells ?? base.revealedCells),
    minePositions: normalizeIndexArray(base.mine_positions ?? base.minePositions),
  };
}

export function getTileState(index: number, revealedCells: number[], minePositions: number[]): TileState {
  if (!revealedCells.includes(index) && !minePositions.includes(index)) {
    return TILE_STATE.HIDDEN;
  }

  if (minePositions.includes(index)) {
    return TILE_STATE.MINE;
  }

  return TILE_STATE.SAFE;
}
