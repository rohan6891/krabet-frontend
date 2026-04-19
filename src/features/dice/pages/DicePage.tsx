"use client";

import { useEffect, useMemo, useState } from "react";
// @ts-ignore side-effect stylesheet import is handled by Next.js runtime
import "@/features/dashboard/pages/DashboardPage.css";
// @ts-ignore side-effect stylesheet import is handled by Next.js runtime
import "./DicePage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { placeDiceBet } from "@/features/dice/api/dice.api";
import type { DiceMode } from "@/features/dice/types/dice.types";

const MIN_TARGET = 2;
const MAX_TARGET = 98;
const HOUSE_EDGE = 1;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatMoney(value: number): string {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function DicePage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();

  const [mode, setMode] = useState<DiceMode>("live");
  const [betAmount, setBetAmount] = useState(10);
  const [target, setTarget] = useState(50);
  const [isRollOver, setIsRollOver] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState("Ready");
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<Array<{
    id: string;
    mode: string;
    target: number;
    roll: number;
    amount: number;
    payout: number;
    status: "win" | "lose";
  }>>([]);

  const winChance = useMemo(() => {
    const rawChance = isRollOver ? 100 - target : target;
    return clamp(rawChance, MIN_TARGET, MAX_TARGET);
  }, [isRollOver, target]);

  const multiplier = useMemo(() => {
    return (100 - HOUSE_EDGE) / winChance;
  }, [winChance]);

  const potentialReturn = useMemo(() => {
    return betAmount * multiplier;
  }, [betAmount, multiplier]);

  useEffect(() => {
    const parsed = Number(walletBalance);
    if (Number.isFinite(parsed)) {
      setDisplayBalance(parsed);
    }
  }, [walletBalance]);

  async function handleRoll() {
    if (isRolling) return;

    const wager = Number(betAmount);
    if (!Number.isFinite(wager) || wager <= 0) {
      setLastResult("Invalid bet amount");
      return;
    }

    setIsRolling(true);
    setLastResult("Rolling...");

    try {
      const result = await placeDiceBet({
        mode,
        amount: wager.toFixed(8),
        target,
        rollOver: isRollOver,
      });

      setLastRoll(result.roll);
      setLastResult(result.outcome === "win" ? "WIN" : "LOSE");
      setDisplayBalance(result.updatedBalance);
      const historyStatus: "win" | "lose" = result.outcome === "win" ? "win" : "lose";

      setHistory((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          mode: mode === "demo" ? "Demo" : "Live",
          target: result.target,
          roll: result.roll,
          amount: wager,
          payout: result.payout,
          status: historyStatus,
        },
        ...prev,
      ].slice(0, 12));

      window.dispatchEvent(
        new CustomEvent("krabets:wallet-refresh", {
          detail: { reason: "bet_settled", game: "dice", outcome: result.outcome },
        }),
      );
    } catch (error) {
      setLastResult(error instanceof Error ? error.message : "Unable to roll now");
    } finally {
      setIsRolling(false);
    }
  }

  if (isChecking) {
    return <div className="dashboard-auth-loading" aria-hidden="true"></div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="krabet-page">
      <div className="krabet-shell">
        <DashboardSidebar logoSrc="/KRABETS-LOGO.png" />

        <main className="krabet-main">
          <DashboardHeader
            walletBalance={walletBalance}
            username={profile.username}
            email={profile.email}
            avatarUrl={profile.avatarUrl}
            displayName={profile.displayName}
            country={profile.country}
            phoneNumber={profile.phoneNumber}
            phoneCountryCode={profile.phoneCountryCode}
            preferredLanguage={profile.preferredLanguage}
            dateOfBirth={profile.dateOfBirth}
          />

          <div className="krabet-wallet-content">
            <div className="dice-page-shell">
              <div className="dice-page-head">
                <p className="dice-breadcrumb">Casino / Originals / Dice</p>
                <h1>Dice</h1>
              </div>

              <div className="dice-grid">
                <section className="dice-card dice-stage">
                  <div className="dice-stage-top">
                    <div className="dice-mode-switch">
                      <button className={mode === "demo" ? "active" : ""} onClick={() => setMode("demo")} disabled={isRolling}>Demo</button>
                      <button className={mode === "live" ? "active" : ""} onClick={() => setMode("live")} disabled={isRolling}>Live</button>
                    </div>
                    <span className="dice-status-pill">{isRolling ? "Rolling" : `${isRollOver ? "Roll Over" : "Roll Under"} ${target.toFixed(2)}`}</span>
                  </div>

                  <div className={`dice-roll-display ${isRolling ? "is-rolling" : ""}`}>
                    <span>{lastRoll === null ? "--.--" : lastRoll.toFixed(2)}</span>
                  </div>

                  <div className="dice-stage-metrics">
                    <article>
                      <span>Result</span>
                      <strong>{lastResult}</strong>
                    </article>
                    <article>
                      <span>Win Chance</span>
                      <strong>{winChance.toFixed(2)}%</strong>
                    </article>
                    <article>
                      <span>Potential Return</span>
                      <strong>${formatMoney(potentialReturn)}</strong>
                    </article>
                  </div>
                </section>

                <aside className="dice-card dice-controls">
                  <div className="dice-balance-box">
                    <span>{mode === "demo" ? "Demo Balance" : "Live Balance"}</span>
                    <strong>${formatMoney(displayBalance)}</strong>
                  </div>

                  <div className="dice-field-group">
                    <label>Bet Type</label>
                    <div className="dice-segment-row">
                      <button className={!isRollOver ? "active" : ""} onClick={() => setIsRollOver(false)} disabled={isRolling}>Roll Under</button>
                      <button className={isRollOver ? "active" : ""} onClick={() => setIsRollOver(true)} disabled={isRolling}>Roll Over</button>
                    </div>
                  </div>

                  <div className="dice-field-group">
                    <label>Target: {target.toFixed(2)}</label>
                    <input
                      type="range"
                      min={MIN_TARGET}
                      max={MAX_TARGET}
                      step="0.01"
                      value={target}
                      onChange={(event) => setTarget(Number(event.target.value))}
                      disabled={isRolling}
                    />
                  </div>

                  <div className="dice-field-group">
                    <label>Bet Amount</label>
                    <div className="dice-bet-row">
                      <button onClick={() => setBetAmount((prev) => Math.max(0.1, Number((prev - 1).toFixed(2))))} disabled={isRolling}>-</button>
                      <input
                        type="number"
                        min="0.1"
                        step="0.01"
                        value={betAmount}
                        onChange={(event) => setBetAmount(Number(event.target.value || 0))}
                        disabled={isRolling}
                      />
                      <button onClick={() => setBetAmount((prev) => Number((prev + 1).toFixed(2)))} disabled={isRolling}>+</button>
                    </div>

                    <div className="dice-quick-bets">
                      {[5, 10, 25, 50, "Max"].map((chip) => (
                        <button
                          key={chip}
                          disabled={isRolling}
                          onClick={() => {
                            if (chip === "Max") {
                              setBetAmount(Number(displayBalance.toFixed(2)));
                              return;
                            }
                            setBetAmount(Number(chip));
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="dice-roll-button" onClick={handleRoll} disabled={isRolling}>
                    {isRolling ? "Rolling..." : mode === "demo" ? "Roll Dice" : "Roll Live"}
                  </button>
                </aside>

                <section className="dice-card dice-history">
                  <div className="dice-card-head">
                    <h3>Recent Bet History</h3>
                    <span>{mode === "demo" ? "Demo mode" : "Live mode"}</span>
                  </div>

                  {history.length === 0 ? (
                    <div className="dice-empty">No rounds played yet.</div>
                  ) : (
                    <div className="dice-history-list">
                      {history.map((row) => (
                        <div key={row.id} className={`dice-history-row ${row.status}`}>
                          <span>{row.mode}</span>
                          <span>{row.target.toFixed(2)}</span>
                          <span>{row.roll.toFixed(2)}</span>
                          <span>${formatMoney(row.amount)}</span>
                          <strong>{row.status === "win" ? `$${formatMoney(row.payout)}` : "$0.00"}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>

          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
