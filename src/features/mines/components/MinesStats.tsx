import { formatMoney, formatMultiplier } from "@/features/mines/utils/mines.utils";

type MinesStatsProps = {
  variant: "board" | "panel";
  statusText?: string;
  multiplier: number;
  payoutNow: number;
  betAmount?: number;
  sessionId?: string;
  pulseMultiplier: boolean;
  pulsePayout: boolean;
};

export function MinesStats({
  variant,
  statusText,
  multiplier,
  payoutNow,
  betAmount,
  sessionId,
  pulseMultiplier,
  pulsePayout,
}: MinesStatsProps) {
  if (variant === "board") {
    return (
      <div className="board-footer">
        <div className="board-stat">
          <span>Status</span>
          <strong>{statusText}</strong>
        </div>
        <div className="board-stat">
          <span>Multiplier</span>
          <strong className={pulseMultiplier ? "value-pulse" : ""}>{formatMultiplier(multiplier)}</strong>
        </div>
        <div className="board-stat">
          <span>Payout</span>
          <strong className={pulsePayout ? "value-pulse" : ""}>${formatMoney(payoutNow)}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span>Multiplier</span>
        <strong className={pulseMultiplier ? "value-pulse" : ""}>{formatMultiplier(multiplier)}</strong>
      </div>
      <div className="stat-card">
        <span>Bet</span>
        <strong>${formatMoney(betAmount ?? 0)}</strong>
      </div>
      <div className="stat-card">
        <span>Payout</span>
        <strong className={pulsePayout ? "value-pulse" : ""}>${formatMoney(payoutNow)}</strong>
      </div>
      <div className="stat-card">
        <span>Session ID</span>
        <strong className="truncate">{sessionId || "--"}</strong>
      </div>
    </div>
  );
}
