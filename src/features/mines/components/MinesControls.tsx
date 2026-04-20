import type { ChangeEvent } from "react";
import { MinesStats } from "@/features/mines/components/MinesStats";
import { formatMoney } from "@/features/mines/utils/mines.utils";

type MinesControlsProps = {
  mode: "live" | "demo";
  gridSize: number;
  betAmount: number;
  stakeAmount: number;
  minesCount: number;
  maxMines: number;
  autoCashoutEnabled: boolean;
  autoCashoutTarget: number;
  isBusy: boolean;
  isPlaying: boolean;
  isStarting: boolean;
  isCashingOut: boolean;
  multiplier: number;
  payoutNow: number;
  sessionId: string;
  pulseMultiplier: boolean;
  pulsePayout: boolean;
  onModeChange: (mode: "live" | "demo") => void;
  onBetChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onStakeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMinesCountChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onAutoCashoutToggle: () => void;
  onAutoCashoutTargetChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onStartGame: () => void;
  onCashout: () => void;
  onReset: () => void;
};

export function MinesControls({
  mode,
  gridSize,
  betAmount,
  stakeAmount,
  minesCount,
  maxMines,
  autoCashoutEnabled,
  autoCashoutTarget,
  isBusy,
  isPlaying,
  isStarting,
  isCashingOut,
  multiplier,
  payoutNow,
  sessionId,
  pulseMultiplier,
  pulsePayout,
  onModeChange,
  onBetChange,
  onStakeChange,
  onMinesCountChange,
  onAutoCashoutToggle,
  onAutoCashoutTargetChange,
  onStartGame,
  onCashout,
  onReset,
}: MinesControlsProps) {
  return (
    <aside className="mines-controls">
      <div className="mines-mode-switch" role="group" aria-label="Mines mode">
        <button
          type="button"
          className={`mines-mode-btn ${mode === "demo" ? "active" : ""}`}
          onClick={() => onModeChange("demo")}
          disabled={isBusy}
        >
          Demo
        </button>
        <button
          type="button"
          className={`mines-mode-btn ${mode === "live" ? "active" : ""}`}
          onClick={() => onModeChange("live")}
          disabled={isBusy}
        >
          Live
        </button>
      </div>

      <div className="section-intro">
        <h2>Bet Controls</h2>
        <p>Set your round and play.</p>
      </div>

      <div className="control-card">
        <label className="control-label">Bet Amount</label>
        <div className="input-wrap">
          <span className="input-prefix">$</span>
          <input
            type="number"
            min="1"
            step="0.01"
            className="casino-input"
            value={betAmount}
            onChange={onBetChange}
            disabled={isBusy || isPlaying}
          />
        </div>
      </div>

      <div className="control-card">
        <div className="control-row">
          <label className="control-label">Stake Slider</label>
          <span className="control-value">${formatMoney(stakeAmount)}</span>
        </div>
        <input
          type="range"
          min="1"
          max="1000"
          step="1"
          value={stakeAmount}
          onChange={onStakeChange}
          className="casino-range"
          disabled={isBusy || isPlaying}
        />
      </div>

      <div className="control-card">
        <div className="control-row">
          <label className="control-label">Grid Size</label>
          <span className="control-value">
            {gridSize}x{gridSize}
          </span>
        </div>
        <select className="casino-input casino-select" value={gridSize} disabled>
          <option value={gridSize}>
            {gridSize} x {gridSize}
          </option>
        </select>
      </div>

      <div className="control-card">
        <div className="control-row">
          <label className="control-label">Mine Count</label>
          <span className="control-value">{minesCount}</span>
        </div>
        <input
          type="range"
          min="1"
          max={maxMines}
          step="1"
          value={minesCount}
          onChange={onMinesCountChange}
          className="casino-range"
          disabled={isBusy || isPlaying}
        />
      </div>

      <div className="control-card">
        <div className="control-row">
          <label className="control-label">Auto Cashout</label>
          <label className="mini-switch">
            <input type="checkbox" checked={autoCashoutEnabled} onChange={onAutoCashoutToggle} disabled={isBusy} />
            <span className="mini-switch-ui"></span>
          </label>
        </div>

        <div className="input-wrap compact-top">
          <span className="input-prefix">x</span>
          <input
            type="number"
            min="1.01"
            step="0.01"
            className="casino-input"
            value={autoCashoutTarget}
            onChange={onAutoCashoutTargetChange}
            disabled={isBusy || !autoCashoutEnabled}
          />
        </div>
      </div>

      <div className="action-stack">
        <button className="casino-btn primary" onClick={onStartGame} disabled={isBusy || isPlaying}>
          {isStarting ? "Starting..." : "Start Game"}
        </button>

        <button className="casino-btn success" onClick={onCashout} disabled={isBusy || !isPlaying}>
          {isCashingOut ? "Cashing out..." : "Cashout"}
        </button>

        <button className="casino-btn secondary" onClick={onReset} disabled={isBusy}>
          Reset
        </button>
      </div>

      <MinesStats
        variant="panel"
        multiplier={multiplier}
        betAmount={betAmount}
        payoutNow={payoutNow}
        sessionId={sessionId}
        pulseMultiplier={pulseMultiplier}
        pulsePayout={pulsePayout}
      />
    </aside>
  );
}
