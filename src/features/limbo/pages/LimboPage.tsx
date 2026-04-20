"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// @ts-ignore side-effect stylesheet import is handled by Next.js runtime
import "@/features/dashboard/pages/DashboardPage.css";
// @ts-ignore side-effect stylesheet import is handled by Next.js runtime
import "./LimboPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { placeLimboBet } from "@/features/limbo/api/limbo.api";
import type { LimboRoundResult } from "@/features/limbo/types/limbo.types";
import { formatInsufficientFundsMessage, resolveBetErrorMessage } from "@/shared/utils/bettingErrors";

const RESULT_STATES = {
  IDLE: "idle",
  RUNNING: "running",
  WIN: "win",
  LOSS: "loss",
  ERROR: "error",
} as const;

type ResultState = (typeof RESULT_STATES)[keyof typeof RESULT_STATES];

type SessionHistoryRow = {
  id: number;
  wager: number;
  target: number;
  result: number;
  payout: number;
  outcome: "Win" | "Loss";
};

function formatCurrency(value: string | number): string {
  const num = Number(value) || 0;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMultiplier(value: string | number): string {
  const num = Number(value) || 0;
  return `${num.toFixed(2)}x`;
}

function toPositiveNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function LimboPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [playMode, setPlayMode] = useState<"manual" | "auto">("manual");

  const [betAmount, setBetAmount] = useState("10.00");
  const [targetMultiplier, setTargetMultiplier] = useState("2.00");

  const [autoBets, setAutoBets] = useState("10");
  const [stopOnProfit, setStopOnProfit] = useState("50.00");
  const [stopOnLoss, setStopOnLoss] = useState("25.00");

  const [balance, setBalance] = useState("0.00");
  const [resultState, setResultState] = useState<ResultState>(RESULT_STATES.IDLE);
  const [rolledMultiplier, setRolledMultiplier] = useState("—");
  const [animatedMultiplier, setAnimatedMultiplier] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  const [showBoom, setShowBoom] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("AN ERROR OCCURED, PLEASE RELOAD AND TRY AGAIN");

  const [sessionHistory, setSessionHistory] = useState<SessionHistoryRow[]>([]);

  const animationFrameRef = useRef<number | null>(null);
  const autoRunTokenRef = useRef(0);

  const isBusy = isLoading || isAnimating;

  const numericBet = useMemo(() => toPositiveNumber(betAmount, 0), [betAmount]);
  const numericTarget = useMemo(() => Math.max(toPositiveNumber(targetMultiplier, 1.01), 1.01), [targetMultiplier]);
  const numericBalance = useMemo(() => {
    const parsed = Number(balance);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [balance]);

  const profitOnWin = useMemo(() => {
    const profit = numericBet * numericTarget - numericBet;
    return Math.max(profit, 0);
  }, [numericBet, numericTarget]);

  const payoutPreview = useMemo(() => {
    return numericBet * numericTarget;
  }, [numericBet, numericTarget]);

  const rocketStateClass = useMemo(() => {
    if (showBoom) return "is-boom";
    if (isAnimating) return "is-running";
    return "is-idle";
  }, [isAnimating, showBoom]);

  useEffect(() => {
    if (isBusy || isAutoRunning) return;
    const parsed = Number(walletBalance);
    if (Number.isFinite(parsed)) {
      setBalance(parsed.toFixed(2));
    }
  }, [walletBalance, isBusy, isAutoRunning]);

  useEffect(() => {
    if (!showBoom) return;
    const timer = window.setTimeout(() => setShowBoom(false), 1200);
    return () => window.clearTimeout(timer);
  }, [showBoom]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      autoRunTokenRef.current = 0;
    };
  }, []);

  const handleNumberInput = (setter: (value: string) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = event.target.value.replace(/[^\d.]/g, "");
    setter(cleaned);
  };

  const applyQuickBet = (type: "half" | "double" | "min" | "max") => {
    const current = Number(betAmount) || 0;
    if (type === "half") setBetAmount(Math.max(current / 2, 0).toFixed(2));
    if (type === "double") setBetAmount((current * 2).toFixed(2));
    if (type === "min") setBetAmount("1.00");
    if (type === "max") setBetAmount("1000.00");
  };

  const bumpTarget = (direction: -1 | 1) => {
    const current = Number(targetMultiplier) || 1.01;
    const next = Math.max(1.01, current + direction * 0.1);
    setTargetMultiplier(next.toFixed(2));
  };

  const triggerErrorPopup = (message?: string) => {
    setResultState(RESULT_STATES.ERROR);
    setErrorMessage(message || "AN ERROR OCCURED, PLEASE RELOAD AND TRY AGAIN");
    setShowErrorModal(true);
  };

  const pushSessionHistory = (row: Omit<SessionHistoryRow, "id">) => {
    setSessionHistory((prev) => [
      {
        id: Date.now() + Math.random(),
        ...row,
      },
      ...prev,
    ]);
  };

  const playBoom = () => {
    setShowBoom(false);
    requestAnimationFrame(() => setShowBoom(true));
  };

  const animateReveal = useCallback(async (finalMultiplier: number): Promise<void> => {
    const safeFinal = Math.max(finalMultiplier, 1);
    const durationMs = Math.min(safeFinal * 300, 2000);
    const start = performance.now();

    setAnimatedMultiplier(1);

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = easeOutCubic(progress);
        const nextValue = 1 + (safeFinal - 1) * eased;

        setAnimatedMultiplier(Number(nextValue.toFixed(2)));

        if (progress >= 1) {
          animationFrameRef.current = null;
          resolve();
          return;
        }

        animationFrameRef.current = window.requestAnimationFrame(tick);
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    });
  }, []);

  const runSingleRound = useCallback(async (): Promise<LimboRoundResult | null> => {
    if (isBusy) return null;

    if (!Number.isFinite(numericBet) || numericBet <= 0) {
      triggerErrorPopup("Bet amount must be greater than 0.");
      return null;
    }

    if (!Number.isFinite(numericTarget) || numericTarget < 1.01) {
      triggerErrorPopup("Target multiplier must be at least 1.01x.");
      return null;
    }

    if (!isDemoMode && numericBet > numericBalance) {
      triggerErrorPopup(formatInsufficientFundsMessage(numericBet, numericBalance));
      return null;
    }

    setResultState(RESULT_STATES.RUNNING);
    setShowBoom(false);
    setRolledMultiplier("...");
    setIsLoading(true);

    try {
      const result = await placeLimboBet({
        mode: isDemoMode ? "demo" : "live",
        amount: numericBet.toFixed(8),
        targetMultiplier: numericTarget.toFixed(2),
      });

      setIsLoading(false);
      setIsAnimating(true);

      await animateReveal(result.rolledMultiplier);

      setIsAnimating(false);
      setRolledMultiplier(Number(result.rolledMultiplier).toFixed(2));
      setBalance(Number(result.updatedBalance).toFixed(2));
      window.dispatchEvent(
        new CustomEvent("krabets:wallet-refresh", {
          detail: {
            reason: "bet_settled",
            game: "limbo",
            outcome: result.outcome,
          },
        }),
      );

      const isWin = result.outcome === "win";
      setResultState(isWin ? RESULT_STATES.WIN : RESULT_STATES.LOSS);

      pushSessionHistory({
        wager: numericBet,
        target: numericTarget,
        result: Number(result.rolledMultiplier.toFixed(2)),
        payout: result.payout,
        outcome: isWin ? "Win" : "Loss",
      });

      playBoom();
      return result;
    } catch (error) {
      setIsLoading(false);
      setIsAnimating(false);

      const message = resolveBetErrorMessage(error, "Unable to complete Limbo bet.", {
        betAmount: numericBet,
        availableBalance: numericBalance,
      });
      triggerErrorPopup(message);
      return null;
    }
  }, [animateReveal, isBusy, isDemoMode, numericBalance, numericBet, numericTarget]);

  const handleBetAction = async () => {
    if (isBusy || isAutoRunning) return;
    await runSingleRound();
  };

  const handleStartAuto = async () => {
    if (isBusy || isAutoRunning) return;

    const token = Date.now();
    autoRunTokenRef.current = token;
    setIsAutoRunning(true);

    let roundsLeft = Math.floor(Number(autoBets));
    if (!Number.isFinite(roundsLeft) || roundsLeft <= 0) {
      roundsLeft = Number.POSITIVE_INFINITY;
    }

    const takeProfit = toPositiveNumber(stopOnProfit, 0);
    const takeLoss = toPositiveNumber(stopOnLoss, 0);
    let cumulativeProfit = 0;

    try {
      while (autoRunTokenRef.current === token && roundsLeft > 0) {
        const round = await runSingleRound();
        if (!round) {
          break;
        }

        cumulativeProfit += round.profit;

        if (takeProfit > 0 && cumulativeProfit >= takeProfit) {
          break;
        }

        if (takeLoss > 0 && cumulativeProfit <= -takeLoss) {
          break;
        }

        roundsLeft -= 1;
      }
    } finally {
      if (autoRunTokenRef.current === token) {
        autoRunTokenRef.current = 0;
      }
      setIsAutoRunning(false);
    }
  };

  const handleStopAuto = () => {
    autoRunTokenRef.current = 0;
    setIsAutoRunning(false);
  };

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
            walletHref="/dashboard/wallet"
          />

          <div className="krabet-wallet-content">
            <div className="limbo-shell">
              <div>
                <p className="limbo-breadcrumb">Casino / Originals / Limbo</p>
                <h1 className="limbo-title">Limbo</h1>
              </div>

              {showErrorModal && (
                <div className="limbo-modal-backdrop" onClick={() => setShowErrorModal(false)}>
                  <div
                    className="limbo-modal"
                    onClick={(event) => event.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Error message"
                  >
                    <h3>{errorMessage}</h3>
                    <button
                      type="button"
                      className="limbo-modal__button"
                      onClick={() => setShowErrorModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              <div className="limbo-layout">
                <div className="limbo-column limbo-column--left">
                  <section className="limbo-card limbo-stage limbo-layout-item limbo-layout-item--stage">
                    <div className="limbo-stage__topbar">
                      <div className="limbo-mode-toggle" aria-label="Demo or live mode">
                        <button
                          type="button"
                          className={`limbo-mode-toggle__btn ${isDemoMode ? "is-active" : ""}`}
                          onClick={() => setIsDemoMode(true)}
                          disabled={isBusy || isAutoRunning}
                        >
                          Demo
                        </button>
                        <button
                          type="button"
                          className={`limbo-mode-toggle__btn ${!isDemoMode ? "is-active" : ""}`}
                          onClick={() => setIsDemoMode(false)}
                          disabled={isBusy || isAutoRunning}
                        >
                          Live
                        </button>
                      </div>

                      <div className={`limbo-status-pill is-${resultState}`}>
                        {resultState === RESULT_STATES.IDLE && "Ready"}
                        {resultState === RESULT_STATES.RUNNING && "Running"}
                        {resultState === RESULT_STATES.WIN && "Win"}
                        {resultState === RESULT_STATES.LOSS && "Loss"}
                        {resultState === RESULT_STATES.ERROR && "Error"}
                      </div>
                    </div>

                    <div className="limbo-stage__visual">
                      <div className="limbo-space-backdrop" aria-hidden="true" />
                      <div className="limbo-orbit-glow limbo-orbit-glow--one" aria-hidden="true" />
                      <div className="limbo-orbit-glow limbo-orbit-glow--two" aria-hidden="true" />

                      {isAnimating && <div className="limbo-radial-speedlines" aria-hidden="true" />}

                      <div className={`limbo-rocket-wrap ${rocketStateClass}`}>
                        <div className="limbo-boom-layer" aria-hidden={!showBoom}>
                          <span className={`limbo-boom-text ${showBoom ? "is-visible" : ""}`}>BOOM</span>
                          <span className={`limbo-explosion limbo-explosion--one ${showBoom ? "is-visible" : ""}`} />
                          <span className={`limbo-explosion limbo-explosion--two ${showBoom ? "is-visible" : ""}`} />
                          <span className={`limbo-explosion limbo-explosion--three ${showBoom ? "is-visible" : ""}`} />
                          <span className={`limbo-explosion limbo-explosion--four ${showBoom ? "is-visible" : ""}`} />
                          <span className={`limbo-explosion limbo-explosion--five ${showBoom ? "is-visible" : ""}`} />
                          <span className={`limbo-shockwave ${showBoom ? "is-visible" : ""}`} />
                        </div>

                        <img
                          src="/limbo-rocket.png"
                          alt="KRABETS limbo rocket"
                          className="limbo-rocket"
                        />
                      </div>

                      <div className="limbo-multiplier-panel">
                        <div className="limbo-metric">
                          <span className="limbo-metric__label">Target</span>
                          <strong className="limbo-metric__value">{formatMultiplier(targetMultiplier)}</strong>
                        </div>

                        <div className="limbo-metric limbo-metric--result">
                          <span className="limbo-metric__label">Result</span>
                          <strong className="limbo-metric__value limbo-metric__value--result">
                            {isAnimating
                              ? `${animatedMultiplier.toFixed(2)}x`
                              : rolledMultiplier === "—" || rolledMultiplier === "..."
                                ? rolledMultiplier
                                : `${rolledMultiplier}x`}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="limbo-card limbo-session-history limbo-layout-item limbo-layout-item--history">
                    <div className="limbo-section-head">
                      <h3>Recent Bet History</h3>
                      <span>This session</span>
                    </div>

                    <div className="limbo-session-history__scroll">
                      {sessionHistory.length === 0 ? (
                        <div className="limbo-empty-state">No rounds played yet.</div>
                      ) : (
                        <div className="limbo-history-table">
                          <div className="limbo-history-table__head">
                            <span>Wager</span>
                            <span>Target</span>
                            <span>Result</span>
                            <span>Payout</span>
                            <span>Outcome</span>
                          </div>

                          {sessionHistory.map((row) => (
                            <div className="limbo-history-table__row" key={row.id}>
                              <span>${formatCurrency(row.wager)}</span>
                              <span>{formatMultiplier(row.target)}</span>
                              <span>{formatMultiplier(row.result)}</span>
                              <span>${formatCurrency(row.payout)}</span>
                              <span className={`is-${row.outcome.toLowerCase()}`}>{row.outcome}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <div className="limbo-column limbo-column--right">
                  <aside className="limbo-card limbo-controls limbo-layout-item limbo-layout-item--controls">
                    <div className="limbo-tabs" role="tablist" aria-label="Play mode">
                      <button
                        type="button"
                        className={`limbo-tabs__btn ${playMode === "manual" ? "is-active" : ""}`}
                        onClick={() => setPlayMode("manual")}
                        disabled={isBusy || isAutoRunning}
                      >
                        Manual
                      </button>
                      <button
                        type="button"
                        className={`limbo-tabs__btn ${playMode === "auto" ? "is-active" : ""}`}
                        onClick={() => setPlayMode("auto")}
                        disabled={isBusy || isAutoRunning}
                      >
                        Auto
                      </button>
                    </div>

                    <div className="limbo-balance-card">
                      <span className="limbo-balance-card__label">{isDemoMode ? "Demo Balance" : "Live Balance"}</span>
                      <strong className="limbo-balance-card__value">${formatCurrency(balance)}</strong>
                    </div>

                    <div className="limbo-field">
                      <div className="limbo-field__head">
                        <label htmlFor="limbo-bet">Bet Amount</label>
                      </div>

                      <div className="limbo-input-shell">
                        <input
                          id="limbo-bet"
                          className="limbo-input"
                          type="text"
                          inputMode="decimal"
                          value={betAmount}
                          onChange={handleNumberInput(setBetAmount)}
                          placeholder="0.00"
                          disabled={isBusy || isAutoRunning}
                        />
                      </div>

                      <div className="limbo-quick-row">
                        <button type="button" onClick={() => applyQuickBet("half")} disabled={isBusy || isAutoRunning}>1/2</button>
                        <button type="button" onClick={() => applyQuickBet("double")} disabled={isBusy || isAutoRunning}>2x</button>
                        <button type="button" onClick={() => applyQuickBet("min")} disabled={isBusy || isAutoRunning}>Min</button>
                        <button type="button" onClick={() => applyQuickBet("max")} disabled={isBusy || isAutoRunning}>Max</button>
                      </div>
                    </div>

                    <div className="limbo-field">
                      <div className="limbo-field__head">
                        <label htmlFor="limbo-target">Target Multiplier</label>
                      </div>

                      <div className="limbo-input-shell limbo-input-shell--stepper">
                        <button
                          type="button"
                          className="limbo-stepper"
                          onClick={() => bumpTarget(-1)}
                          aria-label="Decrease target multiplier"
                          disabled={isBusy || isAutoRunning}
                        >
                          -
                        </button>

                        <input
                          id="limbo-target"
                          className="limbo-input limbo-input--center"
                          type="text"
                          inputMode="decimal"
                          value={targetMultiplier}
                          onChange={handleNumberInput(setTargetMultiplier)}
                          placeholder="2.00"
                          disabled={isBusy || isAutoRunning}
                        />

                        <button
                          type="button"
                          className="limbo-stepper"
                          onClick={() => bumpTarget(1)}
                          aria-label="Increase target multiplier"
                          disabled={isBusy || isAutoRunning}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="limbo-preview-grid">
                      <div className="limbo-preview-card">
                        <span className="limbo-preview-card__label">Profit on Win</span>
                        <strong className="limbo-preview-card__value">${formatCurrency(profitOnWin)}</strong>
                      </div>

                      <div className="limbo-preview-card">
                        <span className="limbo-preview-card__label">Payout</span>
                        <strong className="limbo-preview-card__value">${formatCurrency(payoutPreview)}</strong>
                      </div>
                    </div>

                    {playMode === "auto" && (
                      <div className="limbo-auto-panel">
                        <div className="limbo-field">
                          <div className="limbo-field__head">
                            <label htmlFor="limbo-auto-bets">Auto Bets</label>
                          </div>
                          <div className="limbo-input-shell">
                            <input
                              id="limbo-auto-bets"
                              className="limbo-input"
                              type="text"
                              inputMode="numeric"
                              value={autoBets}
                              onChange={handleNumberInput(setAutoBets)}
                              placeholder="10"
                              disabled={isBusy || isAutoRunning}
                            />
                          </div>
                        </div>

                        <div className="limbo-field">
                          <div className="limbo-field__head">
                            <label htmlFor="limbo-stop-profit">Stop on Profit</label>
                          </div>
                          <div className="limbo-input-shell">
                            <input
                              id="limbo-stop-profit"
                              className="limbo-input"
                              type="text"
                              inputMode="decimal"
                              value={stopOnProfit}
                              onChange={handleNumberInput(setStopOnProfit)}
                              placeholder="0.00"
                              disabled={isBusy || isAutoRunning}
                            />
                          </div>
                        </div>

                        <div className="limbo-field">
                          <div className="limbo-field__head">
                            <label htmlFor="limbo-stop-loss">Stop on Loss</label>
                          </div>
                          <div className="limbo-input-shell">
                            <input
                              id="limbo-stop-loss"
                              className="limbo-input"
                              type="text"
                              inputMode="decimal"
                              value={stopOnLoss}
                              onChange={handleNumberInput(setStopOnLoss)}
                              placeholder="0.00"
                              disabled={isBusy || isAutoRunning}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="limbo-actions">
                      {playMode === "manual" ? (
                        <button type="button" className="limbo-primary-btn" onClick={handleBetAction} disabled={isBusy || isAutoRunning}>
                          {isLoading ? "Placing Bet..." : isAnimating ? "Revealing..." : "Bet"}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="limbo-primary-btn"
                            onClick={handleStartAuto}
                            disabled={isBusy || isAutoRunning}
                          >
                            {isAutoRunning ? "Running Auto..." : "Start Auto"}
                          </button>

                          <button type="button" className="limbo-secondary-btn" onClick={handleStopAuto} disabled={!isAutoRunning}>
                            Stop
                          </button>
                        </>
                      )}
                    </div>
                  </aside>

                  <section className="limbo-card limbo-how-card limbo-layout-item limbo-layout-item--how">
                    <div className="limbo-section-head">
                      <h3>How to Play Limbo</h3>
                      <span>Quick guide</span>
                    </div>

                    <div className="limbo-how-card__content">
                      <p>Choose your bet amount and set a target multiplier.</p>
                      <p>Press Bet to instantly generate a random multiplier.</p>
                      <p>The multiplier will animate and stop at the final value.</p>
                      <p>If the final multiplier is equal to or greater than your target, you win.</p>
                      <p>Your payout is calculated as: Bet x Target Multiplier.</p>
                      <p>There is no cashout - the result is determined instantly.</p>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>

          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
