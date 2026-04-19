"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// @ts-ignore side-effect stylesheet import is handled by Next.js runtime
import "@/features/dashboard/pages/DashboardPage.css";
// @ts-ignore side-effect stylesheet import is handled by Next.js runtime
import "./CrashPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import {
  cashoutCrashBet,
  fetchCrashLiveState,
  fetchCurrentCrashBet,
  placeCrashDemoBet,
  placeCrashRoundBet,
} from "@/features/crash/api/crash.api";
import { HttpError } from "@/shared/api/http";
import { env } from "@/shared/config/env";
import { getAccessTokenFromStorage } from "@/shared/utils/session";
import type { CrashBetRecord } from "@/features/crash/types/crash.types";

const ROUND_HISTORY_LIMIT = 12;
const WAITING_MS = 3200;
const CRASH_HOLD_MS = 1800;
const GRAPH_WIDTH = 920;
const GRAPH_HEIGHT = 430;
const MAX_VISIBLE_POINTS = 240;
const TOP_GRAPH_MULTIPLIER = 400;
const QUICK_BETS = [5, 10, 25, 50, 100];

type Point = { x: number; y: number; m: number };
type PlayMode = "demo" | "live";
type RoundStatus = "waiting" | "running" | "crashed";
type RoundOutcome = "won" | "lost";
type RoundMode = "demo" | "live";

type LocalBet = {
  id?: string;
  amount: number;
  cashedOut: boolean;
  payout: number | null;
};

type QueuedBet = {
  amount: number;
  livePending?: boolean;
  demoCrashPoint?: number;
};

type RecentRound = {
  id: number;
  mode: RoundMode;
  amount: number;
  result: number;
  payout: number;
  outcome: RoundOutcome;
};

type RoundSnapshot = {
  status: RoundStatus;
  multiplier: number;
  crashedAt: number | null;
  canPlaceBet: boolean;
  history: number[];
  activeBet: LocalBet | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toWebSocketBaseUrl(apiBaseUrl: string): string {
  const normalized = apiBaseUrl.replace(/\/$/, "");
  if (normalized.startsWith("https://")) {
    return `wss://${normalized.slice("https://".length)}`;
  }
  if (normalized.startsWith("http://")) {
    return `ws://${normalized.slice("http://".length)}`;
  }
  return normalized;
}

function formatMoney(value: number): string {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMultiplier(value: number): string {
  return `${Number(value || 1).toFixed(2)}x`;
}

function createCrashPoint(multiplier: number, points: Point[]): Point {
  const lastX = points.length ? points[points.length - 1].x : 30;
  return {
    x: Math.min(lastX + 46, GRAPH_WIDTH - 14),
    y: GRAPH_HEIGHT - 16,
    m: multiplier,
  };
}

function buildSvgPath(points: Point[]): string {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    path += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  return path;
}

function makeInitialGraph(): Point[] {
  return [
    { x: 26, y: GRAPH_HEIGHT - 24, m: 1 },
    { x: 52, y: GRAPH_HEIGHT - 24, m: 1 },
  ];
}

function multiplierFromElapsed(elapsedMs: number): number {
  const t = elapsedMs / 1000;
  return Math.exp(0.3 * t);
}

function compressGraphPoints(points: Point[], maxPoints = MAX_VISIBLE_POINTS): Point[] {
  if (points.length <= maxPoints) return points;

  const first = points[0];
  const remaining = points.slice(1);
  const step = remaining.length / (maxPoints - 1);
  const sampled = [first];

  for (let i = 0; i < maxPoints - 2; i += 1) {
    sampled.push(remaining[Math.floor(i * step)]);
  }

  sampled.push(points[points.length - 1]);
  return sampled;
}

function graphPointFromState(elapsedMs: number, multiplier: number): Point {
  const t = clamp(elapsedMs / 20000, 0, 1);
  const x = 26 + t * (GRAPH_WIDTH - 110);
  const floorY = GRAPH_HEIGHT - 22;
  const ceilingY = 74;
  const travel = floorY - ceilingY;
  const normalized = clamp(
    Math.log(Math.max(multiplier, 1)) / Math.log(TOP_GRAPH_MULTIPLIER),
    0,
    1,
  );
  const eased = Math.pow(normalized, 1.08);
  const y = clamp(floorY - eased * travel, ceilingY, floorY);
  return { x, y, m: multiplier };
}

function autoScaleGraphPoints(points: Point[]): Point[] {
  if (points.length < 2) return points;

  const leftX = 26;
  const maxVisibleX = GRAPH_WIDTH - 46;
  const lastX = points[points.length - 1].x;
  if (lastX <= maxVisibleX) {
    return points;
  }

  const span = maxVisibleX - leftX;
  const overflow = Math.max(0, lastX - maxVisibleX);
  const overflowRatio = overflow / Math.max(1, span);
  const scale = 1 / (1 + overflowRatio * 0.68);
  return points.map((point) => ({
    ...point,
    x: leftX + (point.x - leftX) * scale,
  }));
}

function sampleDemoCrashPoint(): number {
  const roll = Math.random();
  if (roll < 0.44) return Number((1 + Math.random() * 1.4).toFixed(2));
  if (roll < 0.74) return Number((2.4 + Math.random() * 2.6).toFixed(2));
  if (roll < 0.92) return Number((5 + Math.random() * 8).toFixed(2));
  return Number((13 + Math.random() * 26).toFixed(2));
}

function mapBetRecord(record: CrashBetRecord | null | undefined): LocalBet | null {
  if (!record) return null;
  return {
    id: record.id,
    amount: Number(record.bet_amount || 0),
    cashedOut: record.status === "won",
    payout: record.payout ? Number(record.payout) : null,
  };
}

export function CrashPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();

  const animationRef = useRef<number | null>(null);
  const roundStartedAtRef = useRef<number | null>(null);
  const waitingEndsAtRef = useRef<number | null>(null);
  const liveMultiplierRef = useRef(1);
  const waitStartedAtRef = useRef<number>(Date.now());
  const demoCrashTargetRef = useRef<number | null>(null);
  const pendingLivePlaceRef = useRef(false);
  const pendingLiveCashoutRef = useRef(false);
  const liveUnsubscribeRef = useRef<(() => void) | null>(null);
  const liveApiUnavailableRef = useRef(false);
  const liveErrorShownRef = useRef(false);

  const [playMode, setPlayMode] = useState<PlayMode>("demo");
  const [roundStatus, setRoundStatus] = useState<RoundStatus>("waiting");
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashedAt, setCrashedAt] = useState<number | null>(null);
  const [graphPoints, setGraphPoints] = useState<Point[]>(makeInitialGraph());
  const [roundHistory, setRoundHistory] = useState<number[]>([2.4, 1.39, 2.1, 1.03, 1.01, 4.12, 55.3]);
  const [networkStatus, setNetworkStatus] = useState("Demo ready");
  const [countdownMs, setCountdownMs] = useState(WAITING_MS);
  const [betAmount, setBetAmount] = useState(10);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [queuedBet, setQueuedBet] = useState<QueuedBet | null>(null);
  const [activeBet, setActiveBet] = useState<LocalBet | null>(null);
  const [liveJoinedRound, setLiveJoinedRound] = useState(false);
  const [liveCanPlaceBet, setLiveCanPlaceBet] = useState(false);
  const [lastResult, setLastResult] = useState("—");
  const [recentRounds, setRecentRounds] = useState<RecentRound[]>([]);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorText, setErrorText] = useState("AN ERROR OCCURED, PLEASE RELOAD AND TRY AGAIN");

  useEffect(() => {
    const parsed = Number(walletBalance);
    if (Number.isFinite(parsed)) {
      setDisplayBalance(parsed);
    }
  }, [walletBalance]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const scaledGraphPoints = useMemo(() => autoScaleGraphPoints(graphPoints), [graphPoints]);
  const activeDot = scaledGraphPoints[scaledGraphPoints.length - 1] || { x: 48, y: GRAPH_HEIGHT - 22, m: 1 };
  const displayPath = useMemo(() => buildSvgPath(scaledGraphPoints), [scaledGraphPoints]);

  const handleError = useCallback((message: string) => {
    setErrorText(message || "AN ERROR OCCURED, PLEASE RELOAD AND TRY AGAIN");
    setIsErrorOpen(true);
    setNetworkStatus("Integration error");
  }, []);

  const pushRoundHistory = useCallback((value: number) => {
    setRoundHistory((prev) => [Number(value.toFixed(2)), ...prev].slice(0, ROUND_HISTORY_LIMIT));
  }, []);

  const addRecentRound = useCallback((entry: Omit<RecentRound, "id">) => {
    setRecentRounds((prev) => [{ ...entry, id: Date.now() + Math.floor(Math.random() * 1000) }, ...prev].slice(0, 8));
  }, []);

  const resetVisualRound = useCallback(() => {
    setRoundStatus("waiting");
    setMultiplier(1);
    setCrashedAt(null);
    setGraphPoints(makeInitialGraph());
    waitStartedAtRef.current = Date.now();
    setCountdownMs(WAITING_MS);
  }, []);

  const finishDemoCrash = useCallback((finalMultiplier: number) => {
    const rounded = Number(finalMultiplier.toFixed(2));
    setRoundStatus("crashed");
    setMultiplier(rounded);
    setCrashedAt(rounded);
    setLastResult(formatMultiplier(rounded));
    pushRoundHistory(rounded);

    if (activeBet && !activeBet.cashedOut) {
      addRecentRound({
        mode: "demo",
        amount: activeBet.amount,
        result: rounded,
        payout: 0,
        outcome: "lost",
      });
    }

    setActiveBet(null);

    window.setTimeout(() => {
      resetVisualRound();
    }, CRASH_HOLD_MS);
  }, [activeBet, addRecentRound, pushRoundHistory, resetVisualRound]);

  const cashoutDemoBet = useCallback(() => {
    setActiveBet((current) => {
      if (!current || current.cashedOut) return current;
      const payout = Number((current.amount * multiplier).toFixed(2));
      addRecentRound({
        mode: "demo",
        amount: current.amount,
        result: Number(multiplier.toFixed(2)),
        payout,
        outcome: "won",
      });
      return {
        ...current,
        cashedOut: true,
        payout,
      };
    });
  }, [addRecentRound, multiplier]);

  const queueBetForNextRound = useCallback(async () => {
    const safeAmount = Number(betAmount);
    if (Number.isNaN(safeAmount) || safeAmount <= 0) return;

    if (playMode === "demo") {
      try {
        setNetworkStatus("Fetching demo round...");
        const demoResult = await placeCrashDemoBet({
          amount: safeAmount.toFixed(8),
          cashoutAt: 1.01,
        });

        setQueuedBet({ amount: safeAmount, demoCrashPoint: demoResult.crashPoint });
        waitStartedAtRef.current = Date.now();
        setCountdownMs(WAITING_MS);
        setNetworkStatus("Demo round queued");
      } catch {
        // If demo API fails, keep gameplay local and uninterrupted.
        setQueuedBet({ amount: safeAmount, demoCrashPoint: sampleDemoCrashPoint() });
        waitStartedAtRef.current = Date.now();
        setCountdownMs(WAITING_MS);
        setNetworkStatus("Demo round queued");
      }

      return;
    }

    setQueuedBet({ amount: safeAmount, livePending: true });
    setNetworkStatus("Bet queued");
  }, [betAmount, playMode]);

  const placeLiveQueuedBet = useCallback(async (amount: number) => {
    try {
      pendingLivePlaceRef.current = true;
      const response = await placeCrashRoundBet(amount.toFixed(8));
      const bet = response.data?.bet;
      if (!bet) throw new Error("Unable to queue live bet");

      setActiveBet({
        id: bet.id,
        amount,
        cashedOut: false,
        payout: null,
      });
      setLiveJoinedRound(true);
      waitingEndsAtRef.current = null;
      setQueuedBet(null);
      setNetworkStatus("Live bet active");
      window.dispatchEvent(new CustomEvent("krabets:wallet-refresh", { detail: { reason: "crash_round_bet" } }));
    } catch (error) {
      if (error instanceof HttpError && error.status === 400) {
        // Round window may have just closed; keep queued and retry on next open round.
        setNetworkStatus(error.message || "Waiting for next round to place bet");
      } else {
        handleError("AN ERROR OCCURED, PLEASE RELOAD AND TRY AGAIN");
        setQueuedBet(null);
        setLiveJoinedRound(false);
      }
    } finally {
      pendingLivePlaceRef.current = false;
    }
  }, [handleError]);

  const cashoutLiveBet = useCallback(async () => {
    if (!activeBet?.id) {
      handleError("AN ERROR OCCURED, PLEASE RELOAD AND TRY AGAIN");
      return;
    }

    try {
      pendingLiveCashoutRef.current = true;
      const response = await cashoutCrashBet(activeBet.id);
      const resolved = response.data?.bet;
      const payout = Number(resolved?.payout || 0);

      setActiveBet((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          cashedOut: true,
          payout,
        };
      });

      addRecentRound({
        mode: "live",
        amount: activeBet.amount,
        result: Number(multiplier.toFixed(2)),
        payout,
        outcome: payout > 0 ? "won" : "lost",
      });
      setNetworkStatus("Cash out requested");
      window.dispatchEvent(new CustomEvent("krabets:wallet-refresh", { detail: { reason: "crash_cashout" } }));
    } catch {
      handleError("AN ERROR OCCURED, PLEASE RELOAD AND TRY AGAIN");
    } finally {
      pendingLiveCashoutRef.current = false;
    }
  }, [activeBet, addRecentRound, handleError, multiplier]);

  const primaryAction = useCallback(() => {
    if (roundStatus === "running" && activeBet && !activeBet.cashedOut) {
      if (playMode === "demo") {
        cashoutDemoBet();
      } else {
        void cashoutLiveBet();
      }
      return;
    }

    if (playMode === "live" && roundStatus === "running" && !activeBet && !queuedBet && liveCanPlaceBet) {
      void queueBetForNextRound();
      return;
    }

    if (roundStatus === "waiting") {
      void queueBetForNextRound();
    }
  }, [activeBet, cashoutDemoBet, cashoutLiveBet, liveCanPlaceBet, playMode, queueBetForNextRound, queuedBet, roundStatus]);

  const subscribeLive = useCallback((handlers: {
    onRoundState: (snapshot: RoundSnapshot) => void;
    onRoundResult: (payload: { crashedAt: number }) => void;
    onApiMissing: () => void;
    onError: () => void;
  }) => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      handlers.onError();
      return () => undefined;
    }

    const wsBase = toWebSocketBaseUrl(env.apiBaseUrl);
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let closed = false;
    let lastCrashPublishedAt: number | null = null;
    let stateApiMissing = false;

    const pollState = async () => {
      if (stateApiMissing || closed) {
        return;
      }

      try {
        const [stateRes, betRes] = await Promise.all([fetchCrashLiveState(), fetchCurrentCrashBet()]);

        const status = stateRes.data?.status || "waiting";
        const liveMultiplier = Number(stateRes.data?.multiplier || 1);
        const liveCrashedAt = stateRes.data?.crashedAt ?? null;
        const canPlaceBet = Boolean(stateRes.data?.canPlaceBet);
        const history = Array.isArray(stateRes.data?.history)
          ? stateRes.data?.history.map((item) => Number(item)).filter((item) => Number.isFinite(item))
          : [];
        const currentBet = mapBetRecord(betRes.data?.bet);

        handlers.onRoundState({
          status,
          multiplier: liveMultiplier,
          crashedAt: liveCrashedAt,
          canPlaceBet,
          history,
          activeBet: currentBet,
        });

        if (status === "crashed" && typeof liveCrashedAt === "number") {
          if (lastCrashPublishedAt !== liveCrashedAt) {
            lastCrashPublishedAt = liveCrashedAt;
            handlers.onRoundResult({ crashedAt: liveCrashedAt });
          }
        }
      } catch (error) {
        if (error instanceof HttpError && error.status === 404) {
          stateApiMissing = true;
          handlers.onApiMissing();
          return;
        }
        handlers.onError();
      }
    };

    const connect = () => {
      socket = new WebSocket(`${wsBase}/ws?token=${encodeURIComponent(token)}`);

      socket.onopen = () => {
        if (closed) {
          socket?.close();
          return;
        }
        const currentSocket = socket;
        if (!currentSocket) {
          return;
        }
        currentSocket.send(JSON.stringify({ action: "subscribe", channel: "game:crash" }));
      };

      socket.onmessage = (event) => {
        let message: { type?: string; payload?: { crash_point?: number } };
        try {
          message = JSON.parse(String(event.data)) as { type?: string; payload?: { crash_point?: number } };
        } catch {
          return;
        }

        if (message.type === "round_crashed" && typeof message.payload?.crash_point === "number") {
          handlers.onRoundResult({ crashedAt: Number(message.payload.crash_point) });
        }

        if (message.type === "round_started" || message.type === "round_locked" || message.type === "round_crashed") {
          void pollState();
        }
      };

      socket.onclose = () => {
        if (closed) return;
        if (!stateApiMissing) {
          reconnectTimer = window.setTimeout(connect, 2000);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();
    void pollState();
    const intervalId = window.setInterval(() => {
      void pollState();
    }, 450);

    return () => {
      closed = true;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      window.clearInterval(intervalId);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  useEffect(() => {
    if (playMode !== "demo") return undefined;

    let timeoutId: number | undefined;

    const demoTick = () => {
      const now = Date.now();

      if (roundStatus === "waiting") {
        const elapsedWaiting = now - waitStartedAtRef.current;
        const remaining = Math.max(0, WAITING_MS - elapsedWaiting);
        setCountdownMs(remaining);

        if (elapsedWaiting >= WAITING_MS) {
          const queued = queuedBet
            ? {
                amount: queuedBet.amount,
                cashedOut: false,
                payout: null,
              }
            : null;

          roundStartedAtRef.current = Date.now();
          setRoundStatus("running");
          setMultiplier(1);
          setGraphPoints(makeInitialGraph());
          setActiveBet(queued);
          setQueuedBet(null);
          demoCrashTargetRef.current = queuedBet?.demoCrashPoint ?? sampleDemoCrashPoint();
        }

        timeoutId = window.setTimeout(demoTick, 70);
        return;
      }

      if (roundStatus === "running") {
        const elapsed = now - (roundStartedAtRef.current ?? now);
        const nextMultiplier = multiplierFromElapsed(elapsed);
        const rounded = Number(nextMultiplier.toFixed(2));
        const point = graphPointFromState(elapsed, rounded);

        setMultiplier(rounded);
        setGraphPoints((prev) => compressGraphPoints([...prev, point]));

        if (demoCrashTargetRef.current && rounded >= Number(demoCrashTargetRef.current)) {
          const crashTarget = Number(demoCrashTargetRef.current);
          setGraphPoints((prev) => {
            const crashPoint = graphPointFromState(elapsed, crashTarget);
            return compressGraphPoints([...prev, crashPoint]);
          });
          finishDemoCrash(crashTarget);
          demoCrashTargetRef.current = null;
          return;
        }

        animationRef.current = window.requestAnimationFrame(demoTick);
      }
    };

    if (roundStatus === "running") {
      animationRef.current = window.requestAnimationFrame(demoTick);
    } else {
      timeoutId = window.setTimeout(demoTick, 50);
    }

    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [finishDemoCrash, playMode, queuedBet, roundStatus]);

  useEffect(() => {
    if (playMode !== "live") return undefined;

    setNetworkStatus("Connecting...");
    liveApiUnavailableRef.current = false;
    liveErrorShownRef.current = false;

    const unsubscribe = subscribeLive({
      onRoundState: (snapshot) => {
        if (snapshot.history.length) {
          setRoundHistory(snapshot.history.slice(0, ROUND_HISTORY_LIMIT));
        }

        setLiveCanPlaceBet(snapshot.canPlaceBet);

        if (queuedBet?.livePending && !snapshot.activeBet) {
          if (snapshot.status === "waiting" && snapshot.canPlaceBet && !pendingLivePlaceRef.current) {
            void placeLiveQueuedBet(queuedBet.amount);
          } else {
            setNetworkStatus("Waiting for next round to place bet");
          }
        }

        // Keep live board idle until user joins with a bet (same feel as demo mode).
        const hasLiveParticipation = Boolean(snapshot.activeBet || liveJoinedRound);
        if (!hasLiveParticipation) {
          setRoundStatus("waiting");
          setMultiplier(1);
          setCrashedAt(null);
          setGraphPoints(makeInitialGraph());
          roundStartedAtRef.current = null;
          setNetworkStatus("Live connected - place bet to join round");
          return;
        }

        setRoundStatus(snapshot.status);
        setMultiplier(Number(snapshot.multiplier || 1));

        if (snapshot.status === "waiting") {
          if (!waitingEndsAtRef.current) {
            waitingEndsAtRef.current = Date.now() + WAITING_MS;
          }
          setCountdownMs(Math.max(0, waitingEndsAtRef.current - Date.now()));
          setCrashedAt(null);
          setGraphPoints(makeInitialGraph());
          roundStartedAtRef.current = null;
        }

        if (snapshot.status === "running") {
          waitingEndsAtRef.current = null;
          const now = Date.now();
          if (!roundStartedAtRef.current) roundStartedAtRef.current = now;
          liveMultiplierRef.current = Number(snapshot.multiplier || 1);

        }

        if (snapshot.status === "crashed") {
          waitingEndsAtRef.current = null;
          const roundCrash = Number(snapshot.crashedAt || snapshot.multiplier || 1);
          setCrashedAt(roundCrash);
          setLastResult(formatMultiplier(roundCrash));

          if (activeBet && !activeBet.cashedOut) {
            addRecentRound({
              mode: "live",
              amount: activeBet.amount,
              result: roundCrash,
              payout: 0,
              outcome: "lost",
            });
          }

          setActiveBet(null);
          setLiveJoinedRound(false);
        } else {
          setActiveBet(snapshot.activeBet);
          if (snapshot.activeBet) {
            setLiveJoinedRound(true);
          }
        }

        setNetworkStatus("Live connected");
      },
      onRoundResult: (result) => {
        pushRoundHistory(result.crashedAt);
        setLastResult(formatMultiplier(result.crashedAt));
        pendingLiveCashoutRef.current = false;
      },
      onApiMissing: () => {
        liveApiUnavailableRef.current = true;
        setNetworkStatus("Live API unavailable (backend route missing)");
        if (!liveErrorShownRef.current) {
          liveErrorShownRef.current = true;
          handleError("LIVE MODE IS UNAVAILABLE: /api/v1/games/crash/state AND /my-bet RETURNED 404. RESTART/UPDATE BACKEND.");
        }
      },
      onError: () => {
        if (liveApiUnavailableRef.current) {
          return;
        }
        if (!liveErrorShownRef.current) {
          liveErrorShownRef.current = true;
          handleError("AN ERROR OCCURED, PLEASE RELOAD AND TRY AGAIN");
        }
      },
    });

    liveUnsubscribeRef.current = unsubscribe;

    return () => {
      if (typeof liveUnsubscribeRef.current === "function") {
        liveUnsubscribeRef.current();
      }
      liveUnsubscribeRef.current = null;
    };
  }, [activeBet, addRecentRound, handleError, placeLiveQueuedBet, playMode, pushRoundHistory, queuedBet, subscribeLive]);

  useEffect(() => {
    if (playMode !== "live") {
      if (typeof liveUnsubscribeRef.current === "function") {
        liveUnsubscribeRef.current();
      }
      liveUnsubscribeRef.current = null;
      resetVisualRound();
      setNetworkStatus("Demo ready");
      setQueuedBet(null);
      setActiveBet(null);
      setLiveJoinedRound(false);
      waitingEndsAtRef.current = null;
      liveMultiplierRef.current = 1;
      setLiveCanPlaceBet(false);
      return;
    }

    roundStartedAtRef.current = null;
    waitingEndsAtRef.current = Date.now() + WAITING_MS;
    liveMultiplierRef.current = 1;
    setGraphPoints(makeInitialGraph());
    setMultiplier(1);
    setCrashedAt(null);
    setLiveCanPlaceBet(false);
  }, [playMode, resetVisualRound]);

  useEffect(() => {
    if (playMode !== "live" || roundStatus !== "waiting") {
      return undefined;
    }

    if (!waitingEndsAtRef.current) {
      waitingEndsAtRef.current = Date.now() + WAITING_MS;
    }

    const intervalId = window.setInterval(() => {
      const endsAt = waitingEndsAtRef.current;
      if (!endsAt) {
        return;
      }

      const remaining = Math.max(0, endsAt - Date.now());
      setCountdownMs(remaining);

      if (remaining <= 0 && liveCanPlaceBet) {
        waitingEndsAtRef.current = Date.now() + WAITING_MS;
        setCountdownMs(WAITING_MS);
      }
    }, 50);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [liveCanPlaceBet, playMode, roundStatus]);

  useEffect(() => {
    if (playMode !== "live" || roundStatus !== "running") {
      return undefined;
    }

    let rafId = 0;
    const tick = () => {
      const startTimeMs = roundStartedAtRef.current ?? Date.now();
      const elapsed = Math.max(0, Date.now() - startTimeMs);
      const calculated = Math.max(1, multiplierFromElapsed(elapsed));
      const nextMultiplier = Number(Math.max(liveMultiplierRef.current, calculated).toFixed(2));

      liveMultiplierRef.current = nextMultiplier;
      setMultiplier(nextMultiplier);

      const point = graphPointFromState(elapsed, nextMultiplier);
      setGraphPoints((prev) => compressGraphPoints([...prev, point]));

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [playMode, roundStatus]);

  const profit = activeBet && activeBet.cashedOut
    ? Number((activeBet.payout || 0) - activeBet.amount)
    : activeBet && roundStatus === "running"
      ? Number((activeBet.amount * multiplier - activeBet.amount).toFixed(2))
      : 0;

  const primaryButtonLabel = useMemo(() => {
    if (roundStatus === "running" && activeBet && !activeBet.cashedOut) {
      return `Cash Out @ ${formatMultiplier(multiplier)}`;
    }
    if (queuedBet) return "Bet Queued";
    if (playMode === "live" && roundStatus === "running" && !activeBet) {
      return liveCanPlaceBet ? "Bet Now" : "Betting Closed";
    }
    if (roundStatus === "crashed") return "Crashed";
    return "Bet (Next Round)";
  }, [activeBet, liveCanPlaceBet, multiplier, playMode, queuedBet, roundStatus]);

  const canPressPrimary = useMemo(() => {
    if (roundStatus === "running" && activeBet && !activeBet.cashedOut) return true;
    if (playMode === "live" && roundStatus === "running" && !activeBet && !queuedBet && liveCanPlaceBet) return true;
    if (roundStatus === "waiting" && !queuedBet) return true;
    return false;
  }, [activeBet, liveCanPlaceBet, playMode, queuedBet, roundStatus]);

  const queuedWagerValue = (queuedBet || activeBet)?.amount ?? 0;
  const waitingProgress = clamp((WAITING_MS - countdownMs) / WAITING_MS, 0, 1);

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
            <div>
              <p className="limbo-breadcrumb">Krabets-Originals / Crash</p>
              <h1 className="limbo-title">Crash</h1>
            </div>

            <div className="crash-game-shell">
              <div className="crash-layout-grid">
                <section className="crash-display-card" aria-label="Crash graph display">
                  <div className="crash-display-toolbar">
                    <div className="crash-mode-switch" role="tablist" aria-label="Demo or live mode">
                      <button
                        type="button"
                        className={playMode === "demo" ? "active" : ""}
                        onClick={() => setPlayMode("demo")}
                      >
                        Demo
                      </button>
                      <button
                        type="button"
                        className={playMode === "live" ? "active" : ""}
                        onClick={() => setPlayMode("live")}
                      >
                        Live
                      </button>
                    </div>

                    <div className={`crash-round-badge ${roundStatus === "waiting" ? "idle" : roundStatus}`}>
                      {roundStatus === "waiting" ? `Starting in ${(countdownMs / 1000).toFixed(1)}s` : roundStatus}
                    </div>
                  </div>

                  {roundStatus === "waiting" && (
                    <div className="crash-waiting-progress" aria-label="Next round countdown">
                      <div className="crash-waiting-progress-track">
                        <div
                          className="crash-waiting-progress-fill"
                          style={{ width: `${Math.round(waitingProgress * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <section className="crash-top-strip inside-display" aria-label="Recent crash multipliers">
                    {roundHistory.map((item, index) => (
                      <div key={`${item}-${index}`} className={`crash-history-pill ${item >= 2 ? "good" : "bad"}`}>
                        {formatMultiplier(item)}
                      </div>
                    ))}
                  </section>

                  <div className={`crash-graph-board ${roundStatus === "crashed" ? "is-crashed" : ""}`}>
                    <div className="crash-grid-overlay" aria-hidden="true" />

                    <svg
                      className="crash-graph-svg"
                      viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id="crashLineGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#b96bff" />
                          <stop offset="100%" stopColor="#7a30ff" />
                        </linearGradient>
                        <linearGradient id="crashFillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(143, 70, 255, 0.32)" />
                          <stop offset="100%" stopColor="rgba(143, 70, 255, 0)" />
                        </linearGradient>
                      </defs>

                      <path d={displayPath} className={`crash-line ${roundStatus === "crashed" ? "crashed" : ""}`} />

                      {roundStatus !== "crashed" && displayPath && (
                        <path d={`${displayPath} L ${activeDot.x} ${GRAPH_HEIGHT} L 26 ${GRAPH_HEIGHT} Z`} className="crash-area" />
                      )}

                      <circle
                        cx={activeDot.x}
                        cy={activeDot.y}
                        r={8}
                        className={`crash-dot ${roundStatus === "crashed" ? "crashed" : ""}`}
                      />
                    </svg>

                    <div className={`crash-multiplier-readout ${roundStatus === "crashed" ? "crashed" : ""}`}>
                      {roundStatus === "crashed" ? formatMultiplier(crashedAt || multiplier) : formatMultiplier(multiplier)}
                    </div>

                    <div className="crash-axis-labels">
                      <span>0s</span>
                      <span>5s</span>
                      <span>10s</span>
                      <span>15s</span>
                      <span>20s</span>
                    </div>

                    <div className="crash-network-status">Network Status: {networkStatus}</div>
                  </div>

                  <div className="crash-display-stats">
                    <article className="display-stat-box">
                      <span className="stat-caption">Your Pick</span>
                      <strong>{queuedBet || activeBet ? formatMoney((queuedBet || activeBet)!.amount) : "—"}</strong>
                    </article>
                    <article className="display-stat-box">
                      <span className="stat-caption">Last Result</span>
                      <strong>{lastResult}</strong>
                    </article>
                    <article className="display-stat-box">
                      <span className="stat-caption">Live Profit</span>
                      <strong className={profit >= 0 ? "positive" : "negative"}>
                        {activeBet ? `$${formatMoney(Math.max(profit, 0))}` : "$0.00"}
                      </strong>
                    </article>
                  </div>
                </section>

                <aside className="crash-controls-card" aria-label="Bet controls">
                  <div className="controls-balance-row">
                    <div>
                      <span className="mini-label">{playMode === "demo" ? "Demo Balance" : "Live Balance"}</span>
                      <strong>${formatMoney(displayBalance)}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`primary-bet-button primary-bet-button-top ${roundStatus === "running" && activeBet && !activeBet.cashedOut ? "cashout" : ""}`}
                    onClick={primaryAction}
                    disabled={!canPressPrimary}
                  >
                    <span>{primaryButtonLabel}</span>
                    {roundStatus === "waiting" && <small>{playMode === "demo" ? "Next round" : "Queued for live"}</small>}
                  </button>

                  <div className="form-group-block">
                    <label className="mini-label" htmlFor="crashBetAmount">Bet Amount</label>
                    <div className="amount-stepper">
                      <button
                        type="button"
                        onClick={() => setBetAmount((prev) => Math.max(1, Number((prev - 1).toFixed(2))))}
                      >
                        −
                      </button>
                      <input
                        id="crashBetAmount"
                        type="number"
                        min="1"
                        step="0.01"
                        value={betAmount}
                        onChange={(event) => setBetAmount(Number(event.target.value || 0))}
                      />
                      <button
                        type="button"
                        onClick={() => setBetAmount((prev) => Number((prev + 1).toFixed(2)))}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="quick-bet-row">
                    {QUICK_BETS.map((amount) => (
                      <button key={amount} type="button" onClick={() => setBetAmount(amount)}>
                        {amount === 100 ? "Max" : amount}
                      </button>
                    ))}
                  </div>

                  <div className="controls-metrics-grid">
                    <article>
                      <span className="mini-label">Current Multiplier</span>
                      <strong>{formatMultiplier(multiplier)}</strong>
                    </article>
                    <article>
                      <span className="mini-label">Queued Wager</span>
                      <strong>${formatMoney(Number(queuedWagerValue))}</strong>
                    </article>
                  </div>

                  <div className="integration-note">
                    <strong>Fair Gameplay</strong>
                    <p>
                      This game is provably fair, results are random and cannot be manipulated. Always play responsibly and only bet what you can afford to lose.
                    </p>
                  </div>
                </aside>

                <section className="crash-history-card" aria-label="Recent bet history">
                  <div className="card-header-row">
                    <h3>Recent Bet History</h3>
                    <span>{playMode === "demo" ? "Demo mode" : "Live mode"}</span>
                  </div>

                  {recentRounds.length ? (
                    <div className="history-table-wrap">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Mode</th>
                            <th>Bet</th>
                            <th>Result</th>
                            <th>Payout</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentRounds.map((round) => (
                            <tr key={round.id}>
                              <td>{round.mode}</td>
                              <td>${formatMoney(round.amount)}</td>
                              <td>{formatMultiplier(round.result)}</td>
                              <td>${formatMoney(round.payout)}</td>
                              <td className={round.outcome === "won" ? "won" : "lost"}>{round.outcome}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-history-state">No rounds played yet.</div>
                  )}
                </section>

                <section className="crash-howto-card" aria-label="How to play crash">
                  <div className="card-header-row">
                    <h3>How to Play Crash</h3>
                    <span>Quick guide</span>
                  </div>

                  <div className="howto-steps">
                    <p>Choose Demo to test the flow locally, or switch to Live once your backend is wired.</p>
                    <p>Place your bet before the next round starts.</p>
                    <p>Watch the purple curve rise and cash out before the game crashes.</p>
                    <p>The line turns red when the round crashes. Any active bet left in the round loses.</p>
                    <p>On mobile, bet controls stay directly under the graph for faster betting and cashout flow.</p>
                  </div>
                </section>
              </div>

              {isErrorOpen && (
                <div className="crash-error-modal" role="dialog" aria-modal="true" aria-label="Crash game error">
                  <div className="crash-error-card">
                    <h4>Connection Error</h4>
                    <p>{errorText}</p>
                    <button type="button" onClick={() => setIsErrorOpen(false)}>Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
