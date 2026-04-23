"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
// @ts-ignore side-effect stylesheet import is handled by Next.js runtime
import "@/features/dashboard/pages/DashboardPage.css";
// @ts-ignore side-effect stylesheet import is handled by Next.js runtime
import "./MinesPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { GameChatOverlay } from "@/features/chat/components/GameChatOverlay";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { MinesBoard } from "@/features/mines/components/MinesBoard";
import { MinesControls } from "@/features/mines/components/MinesControls";
import { MinesHistory } from "@/features/mines/components/MinesHistory";
import {
  DEFAULT_BET,
  DEFAULT_CURRENCY,
  DEFAULT_GRID_SIZE,
  DEFAULT_MINES,
  DEFAULT_STAKE,
  GAME_STATUS,
  MAX_HISTORY,
  SESSION_STORAGE_KEY,
  TILE_STATE,
} from "@/features/mines/constants/mines.constants";
import {
  cashoutMinesSession,
  getMinesSession,
  startMinesSession,
  submitMinesMove,
} from "@/features/mines/api/mines.api";
import { clamp, getTileState, normalizeMinesState } from "@/features/mines/utils/mines.utils";
import { formatInsufficientFundsMessage, resolveBetErrorMessage } from "@/shared/utils/bettingErrors";
import type { MineTileView, MinesHistoryEntry } from "@/features/mines/types/mines.types";
import type { GameStatus } from "@/features/mines/constants/mines.constants";

type MinesMode = "live" | "demo";

export function MinesPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();

  const [mode, setMode] = useState<MinesMode>("live");
  const gridSize = DEFAULT_GRID_SIZE;
  const [minesCount, setMinesCount] = useState(DEFAULT_MINES);
  const [betAmount, setBetAmount] = useState(DEFAULT_BET);
  const [stakeAmount, setStakeAmount] = useState(DEFAULT_STAKE);
  const [currency] = useState(DEFAULT_CURRENCY);
  const [displayWalletBalance, setDisplayWalletBalance] = useState(walletBalance);
  const [pendingDisplayWalletBalance, setPendingDisplayWalletBalance] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState("");
  const [gameStatus, setGameStatus] = useState<GameStatus>(GAME_STATUS.IDLE);
  const [revealedCells, setRevealedCells] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [demoMinePositions, setDemoMinePositions] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState(1);

  const [isStarting, setIsStarting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const [pendingTileIndex, setPendingTileIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const [autoCashoutTarget, setAutoCashoutTarget] = useState(2.0);
  const [history, setHistory] = useState<MinesHistoryEntry[]>([]);

  const [flashByIndex, setFlashByIndex] = useState<Record<number, { order: number; type: string }>>({});
  const [isLossAnimating, setIsLossAnimating] = useState(false);
  const [pulseMultiplier, setPulseMultiplier] = useState(false);
  const [pulsePayout, setPulsePayout] = useState(false);

  const previousRevealedRef = useRef<number[]>([]);
  const previousStatusRef = useRef<GameStatus>(GAME_STATUS.IDLE);

  const totalTiles = useMemo(() => gridSize * gridSize, [gridSize]);
  const maxMines = useMemo(() => Math.max(1, totalTiles - 1), [totalTiles]);
  const isBusy = isStarting || isMoving || isCashingOut;
  const isPlaying = gameStatus === GAME_STATUS.PLAYING;
  const isRevealAnimating = useMemo(() => Object.keys(flashByIndex).length > 0, [flashByIndex]);
  const shouldDeferWalletSync = isBusy || isRevealAnimating || isLossAnimating;

  const payoutNow = useMemo(() => Number((Number(betAmount) * Number(multiplier)).toFixed(2)), [betAmount, multiplier]);
  const numericDisplayBalance = useMemo(() => {
    const parsed = Number(displayWalletBalance);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [displayWalletBalance]);

  const statusText = useMemo(() => {
    if (gameStatus === GAME_STATUS.PLAYING) return "Playing";
    if (gameStatus === GAME_STATUS.WON) return "Won";
    if (gameStatus === GAME_STATUS.LOST) return "Lost";
    return "Idle";
  }, [gameStatus]);

  useEffect(() => {
    setMinesCount((prev) => clamp(prev, 1, maxMines));
  }, [maxMines]);

  useEffect(() => {
    if (mode !== "live") return;

    if (shouldDeferWalletSync) {
      setPendingDisplayWalletBalance(walletBalance);
      return;
    }

    setDisplayWalletBalance(walletBalance);
    setPendingDisplayWalletBalance(null);
  }, [mode, walletBalance, shouldDeferWalletSync]);

  useEffect(() => {
    if (mode !== "demo") return;

    if (shouldDeferWalletSync) {
      setPendingDisplayWalletBalance(walletBalance);
      return;
    }

    setDisplayWalletBalance(walletBalance);
    setPendingDisplayWalletBalance(null);
  }, [mode, walletBalance, shouldDeferWalletSync]);

  useEffect(() => {
    if (shouldDeferWalletSync) return;
    if (!pendingDisplayWalletBalance) return;

    setDisplayWalletBalance(pendingDisplayWalletBalance);
    setPendingDisplayWalletBalance(null);
  }, [pendingDisplayWalletBalance, shouldDeferWalletSync]);

  useEffect(() => {
    if (sessionId) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [sessionId]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const storedSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (!storedSessionId) return;

      try {
        const response = await getMinesSession(storedSessionId);
        if (!active) return;
        applyBackendState(response, { action: "sync", recordHistory: false });
      } catch {
        if (!active) return;
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!autoCashoutEnabled) return;
    if (!isPlaying) return;
    if (isBusy) return;
    if (!sessionId) return;
    if (multiplier < autoCashoutTarget) return;

    void handleCashout();
  }, [autoCashoutEnabled, autoCashoutTarget, multiplier, isPlaying, isBusy, sessionId]);

  function addHistoryEntry(entry: MinesHistoryEntry) {
    setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
  }

  function pulseValues() {
    setPulseMultiplier(true);
    setPulsePayout(true);
    window.setTimeout(() => {
      setPulseMultiplier(false);
      setPulsePayout(false);
    }, 650);
  }

  function triggerLossAnimation() {
    setIsLossAnimating(true);
    window.setTimeout(() => {
      setIsLossAnimating(false);
    }, 700);
  }

  function animateReveals(nextRevealed: number[], nextMines: number[]) {
    const previousRevealed = previousRevealedRef.current;
    const newlyRevealed = nextRevealed.filter((index) => !previousRevealed.includes(index));

    const mineReveal = nextMines.filter((index) => !previousRevealed.includes(index));
    const revealOrder = [...newlyRevealed, ...mineReveal.filter((index) => !newlyRevealed.includes(index))];

    if (revealOrder.length === 0) {
      previousRevealedRef.current = nextRevealed;
      return;
    }

    const nextFlashState: Record<number, { order: number; type: string }> = {};
    revealOrder.forEach((index, order) => {
      nextFlashState[index] = {
        order,
        type: nextMines.includes(index) ? TILE_STATE.MINE : TILE_STATE.SAFE,
      };
    });

    setFlashByIndex(nextFlashState);
    window.setTimeout(() => {
      setFlashByIndex({});
    }, 1000);

    previousRevealedRef.current = nextRevealed;
  }

  function applyBackendState(
    payload: Parameters<typeof normalizeMinesState>[0],
    options: {
      action?: "sync" | "start" | "move" | "cashout";
      recordHistory?: boolean;
      clickedTileIndex?: number | null;
    } = {},
  ) {
    const { action = "sync", recordHistory = true, clickedTileIndex = null } = options;
    const normalized = normalizeMinesState(payload);

    setSessionId(normalized.sessionId || "");
    setMinesCount(clamp(Number(normalized.mineCount || minesCount), 1, maxMines));
    setRevealedCells(normalized.revealedCells);
    setMinePositions(normalized.minePositions);
    setMultiplier(normalized.multiplier);
    setGameStatus(normalized.status);

    animateReveals(normalized.revealedCells, normalized.minePositions);

    if (normalized.status !== previousStatusRef.current) {
      pulseValues();
    }

    if (
      recordHistory &&
      previousStatusRef.current === GAME_STATUS.PLAYING &&
      normalized.status === GAME_STATUS.WON
    ) {
      addHistoryEntry({
        id: `${Date.now()}-${action}`,
        result: action === "cashout" ? "Cashout" : "Win",
        bet: Number(betAmount),
        multiplier: normalized.multiplier,
        payout: Number((Number(betAmount) * Number(normalized.multiplier)).toFixed(2)),
      });
    }

    if (
      recordHistory &&
      previousStatusRef.current === GAME_STATUS.PLAYING &&
      normalized.status === GAME_STATUS.LOST
    ) {
      triggerLossAnimation();
      addHistoryEntry({
        id: `${Date.now()}-${action}-loss`,
        result: "Loss",
        bet: Number(betAmount),
        multiplier: normalized.multiplier,
        payout: 0,
      });
    }

    previousStatusRef.current = normalized.status;
  }

  function dispatchLiveWalletRefresh(reason: string) {
    if (mode !== "live") return;

    window.dispatchEvent(
      new CustomEvent("krabets:wallet-refresh", {
        detail: { reason, game: "mines" },
      }),
    );
  }

  async function handleStartGame() {
    if (isBusy || isPlaying) return;

    setErrorMessage("");
    setIsStarting(true);

    try {
      const amount = Number(betAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Bet amount must be greater than 0.");
      }
      
      let data;
      if (mode === "demo") {
        const positions: number[] = [];
        while (positions.length < minesCount) {
          const r = Math.floor(Math.random() * (gridSize * gridSize));
          if (!positions.includes(r)) positions.push(r);
        }

        setDemoMinePositions(positions);
        data = await new Promise<any>((resolve) => {
          setTimeout(() => {
            const sessionId = "demo-" + Math.random().toString(36).substring(2, 9);
            resolve({
              sessionId,
              status: GAME_STATUS.PLAYING,
              mineCount: minesCount,
              multiplier: 1.0,
              revealedCells: [],
              minePositions: [],
            });
          }, 300);
        });
      } else {
        if (amount > numericDisplayBalance) {
          throw new Error(formatInsufficientFundsMessage(amount, numericDisplayBalance));
        }

        data = await startMinesSession({
          mode,
          amount: amount.toFixed(2),
          currency,
          mine_count: minesCount,
        });

        setDemoMinePositions([]);
      }

      previousRevealedRef.current = [];
      previousStatusRef.current = GAME_STATUS.IDLE;
      setMinePositions([]);
      applyBackendState(data, { action: "start", recordHistory: false, clickedTileIndex: null });

      if (mode === "live") {
        dispatchLiveWalletRefresh("mines_session_start");
      }
    } catch (error) {
      setErrorMessage(resolveBetErrorMessage(error, "Unable to start game.", {
        betAmount: Number(betAmount),
        availableBalance: numericDisplayBalance,
      }));
    } finally {
      setIsStarting(false);
    }
  }

  async function handleTileClick(tileIndex: number) {
    if (!isPlaying || isBusy || !sessionId) return;

    const tileState = getTileState(tileIndex, revealedCells, minePositions);
    if (tileState !== TILE_STATE.HIDDEN) return;

    setErrorMessage("");
    setPendingTileIndex(tileIndex);
    setIsMoving(true);

    try {
      let data;
      if (mode === "demo") {
        data = await new Promise<any>((resolve) => {
          setTimeout(() => {
            const hit = demoMinePositions.includes(tileIndex);
            const nextRevealed = [...revealedCells, tileIndex];
            if (hit) {
              resolve({
                sessionId,
                status: GAME_STATUS.LOST,
                mineCount: minesCount,
                multiplier: 0,
                revealedCells: nextRevealed,
                minePositions: demoMinePositions,
              });
            } else {
              const safe = (gridSize * gridSize) - minesCount;
              const safeRevealed = nextRevealed.length;
              const willWin = safeRevealed === safe;
              const multi = 1 + (safeRevealed * 0.15); // dummy demo multiplier
              resolve({
                sessionId,
                status: willWin ? GAME_STATUS.WON : GAME_STATUS.PLAYING,
                mineCount: minesCount,
                multiplier: Number(multi.toFixed(2)),
                revealedCells: nextRevealed,
                minePositions: willWin ? demoMinePositions : [],
              });
            }
          }, 300);
        });
      } else {
        data = await submitMinesMove({
          sessionId,
          tileIndex,
        });
      }

      applyBackendState(data, { action: "move", recordHistory: true, clickedTileIndex: tileIndex });

      if (mode === "live") {
        const nextState = normalizeMinesState(data);
        if (nextState.status !== GAME_STATUS.PLAYING) {
          dispatchLiveWalletRefresh("mines_session_settled");
        }
      }
    } catch (error) {
      setErrorMessage(resolveBetErrorMessage(error, "Unable to process move."));
    } finally {
      setPendingTileIndex(null);
      setIsMoving(false);
    }
  }

  async function handleCashout() {
    if (!isPlaying || isBusy || !sessionId) return;

    setErrorMessage("");
    setIsCashingOut(true);

    try {
      let data;
      if (mode === "demo") {
        data = await new Promise<any>((resolve) => {
          setTimeout(() => {
            resolve({
              sessionId,
              status: GAME_STATUS.WON,
              mineCount: minesCount,
              multiplier,
              revealedCells,
              minePositions: demoMinePositions,
            });
          }, 300);
        });
      } else {
        data = await cashoutMinesSession({ sessionId });
      }

      applyBackendState(data, { action: "cashout", recordHistory: true, clickedTileIndex: null });

      if (mode === "live") {
        dispatchLiveWalletRefresh("mines_cashout");
      }
    } catch (error) {
      setErrorMessage(resolveBetErrorMessage(error, "Unable to cash out."));
    } finally {
      setIsCashingOut(false);
    }
  }

  function handleReset() {
    setSessionId("");
    setGameStatus(GAME_STATUS.IDLE);
    setRevealedCells([]);
    setMinePositions([]);
    setDemoMinePositions([]);
    setMultiplier(1);
    setFlashByIndex({});
    setPendingTileIndex(null);
    setErrorMessage("");
    previousRevealedRef.current = [];
    previousStatusRef.current = GAME_STATUS.IDLE;
  }

  function handleBetChange(event: ChangeEvent<HTMLInputElement>) {
    const value = Number(event.target.value);
    const safeValue = Number.isFinite(value) ? value : 0;
    setBetAmount(safeValue);
    setStakeAmount(safeValue);
  }

  function handleStakeChange(event: ChangeEvent<HTMLInputElement>) {
    const value = Number(event.target.value);
    setStakeAmount(value);
    setBetAmount(value);
  }

  const tiles = useMemo<MineTileView[]>(() => {
    return Array.from({ length: gridSize * gridSize }, (_, index) => {
      const state = getTileState(index, revealedCells, minePositions);
      const flash = flashByIndex[index];

      return {
        index,
        state,
        flash: Boolean(flash),
        flashType: flash?.type as MineTileView["flashType"],
      };
    });
  }, [flashByIndex, gridSize, minePositions, revealedCells]);

  const revealDelayByIndex = useMemo(() => {
    const delays: Record<number, number> = {};
    Object.entries(flashByIndex).forEach(([index, info]) => {
      delays[Number(index)] = info.order * 65;
    });
    return delays;
  }, [flashByIndex]);

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
            walletBalance={displayWalletBalance}
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

          <div className="krabet-content">
            <div className="mines-shell">
              <div className={`mines-widget ${isLossAnimating ? "loss-flash" : ""}`}>
                {errorMessage ? (
                  <div className="mines-modal-backdrop" onClick={() => setErrorMessage("")}>
                    <div
                      className="mines-modal"
                      onClick={(event) => event.stopPropagation()}
                      role="dialog"
                      aria-modal="true"
                      aria-label="Error message"
                    >
                      <h3>{errorMessage}</h3>
                      <button
                        type="button"
                        className="mines-modal__button"
                        onClick={() => setErrorMessage("")}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="mines-header">
                  <div>
                    <p className="mines-breadcrumb">Casino / Originals / Mines</p>
                    <h1 className="mines-title">Mines</h1>
                  </div>

                  <div className={`mines-status status-${gameStatus}`}>
                    <span className="status-dot"></span>
                    <span>{statusText}</span>
                  </div>
                </div>

                <div className="mines-main">
                  <MinesBoard
                    gridSize={gridSize}
                    minesCount={minesCount}
                    tiles={tiles}
                    statusText={statusText}
                    multiplier={multiplier}
                    payoutNow={payoutNow}
                    isPlaying={isPlaying}
                    isBusy={isBusy}
                    pendingTileIndex={pendingTileIndex}
                    revealDelayByIndex={revealDelayByIndex}
                    isLossAnimating={isLossAnimating}
                    onTileClick={handleTileClick}
                    pulseMultiplier={pulseMultiplier}
                    pulsePayout={pulsePayout}
                  />

                  <MinesControls
                    mode={mode}
                    gridSize={gridSize}
                    betAmount={betAmount}
                    stakeAmount={stakeAmount}
                    minesCount={minesCount}
                    maxMines={maxMines}
                    autoCashoutEnabled={autoCashoutEnabled}
                    autoCashoutTarget={autoCashoutTarget}
                    isBusy={isBusy}
                    isPlaying={isPlaying}
                    isStarting={isStarting}
                    isCashingOut={isCashingOut}
                    multiplier={multiplier}
                    payoutNow={payoutNow}
                    sessionId={sessionId}
                    pulseMultiplier={pulseMultiplier}
                    pulsePayout={pulsePayout}
                    onModeChange={(nextMode) => {
                      if (nextMode === mode) return;
                      handleReset();
                      setMode(nextMode);
                    }}
                    onBetChange={handleBetChange}
                    onStakeChange={handleStakeChange}
                    onMinesCountChange={(e) => setMinesCount(Number(e.target.value))}
                    onAutoCashoutToggle={() => setAutoCashoutEnabled((prev) => !prev)}
                    onAutoCashoutTargetChange={(e) => setAutoCashoutTarget(Math.max(1.01, Number(e.target.value) || 1.01))}
                    onStartGame={handleStartGame}
                    onCashout={handleCashout}
                    onReset={handleReset}
                  />
                </div>

                <div className="mines-bottom">
                  <MinesHistory history={history} />

                  <section className="how-to-panel">
                    <div className="section-intro">
                      <h2>How to Play</h2>
                      <p>Basic rules.</p>
                    </div>

                    <div className="how-to-list">
                      <div className="how-step">
                        <span className="step-dot"></span>
                        <p>Choose your bet, stake, and mine count.</p>
                      </div>
                      <div className="how-step">
                        <span className="step-dot"></span>
                        <p>Start the round and reveal tiles one by one.</p>
                      </div>
                      <div className="how-step">
                        <span className="step-dot"></span>
                        <p>Each safe reveal updates your multiplier from the backend.</p>
                      </div>
                      <div className="how-step">
                        <span className="step-dot"></span>
                        <p>Cash out before hitting a mine.</p>
                      </div>
                    </div>
                  </section>
                </div>

              </div>
            </div>
          </div>

          <GameChatOverlay roomCode="mines" />
          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
