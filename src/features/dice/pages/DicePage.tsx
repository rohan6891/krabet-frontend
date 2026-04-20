"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@/features/dashboard/pages/DashboardPage.css";
import "./DicePage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { placeDiceBet } from "@/features/dice/api/dice.api";
import { formatInsufficientFundsMessage, resolveBetErrorMessage } from "@/shared/utils/bettingErrors";
import type { DiceMode } from "@/features/dice/types/dice.types";

const HOUSE_EDGE = 1;
const MIN_TARGET = 2;
const MAX_TARGET = 98;
const DEFAULT_BET = 10;
const DICE_OBJ_PATH = "/dice.obj";

type DiceHistoryEntry = {
  id: string;
  mode: "Demo" | "Live";
  type: "Roll Over" | "Roll Under";
  target: number;
  roll: number;
  win: boolean;
  amount: number;
  payout: number;
};

type StageResultState = {
  visible: boolean;
  exiting: boolean;
  text: string;
  win: boolean;
};

type RollState = {
  active: boolean;
  startTime: number;
  duration: number;
  finalFace: number;
  settleFrom: { x: number; y: number; z: number };
};

declare global {
  interface Window {
    THREE?: any;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatAmount(value: number): string {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getWinChance(target: number, isRollOver: boolean): number {
  const rawChance = isRollOver ? 100 - target : target;
  return clamp(rawChance, MIN_TARGET, MAX_TARGET);
}

function getMultiplier(winChance: number): number {
  return (100 - HOUSE_EDGE) / winChance;
}

function getPotentialProfit(betAmount: number, multiplier: number): number {
  return Number(betAmount || 0) * multiplier;
}

function getDiceFaceFromRoll(roll: number): number {
  if (roll < 16.67) return 1;
  if (roll < 33.34) return 2;
  if (roll < 50.01) return 3;
  if (roll < 66.68) return 4;
  if (roll < 83.35) return 5;
  return 6;
}

function getRotationForFace(face: number, THREE: any): any {
  const eulerMap: Record<number, [number, number, number]> = {
    1: [0, 0, 0],
    2: [0, -Math.PI / 2, 0],
    3: [Math.PI / 2, 0, 0],
    4: [-Math.PI / 2, 0, 0],
    5: [0, Math.PI / 2, 0],
    6: [0, Math.PI, 0],
  };
  const [x, y, z] = eulerMap[face] || eulerMap[1];
  return new THREE.Euler(x, y, z);
}

function ensureThreeLoaded(): Promise<any> {
  return import("three");
}

function createStarryDiceTexture(THREE: any): any {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_CONTEXT_FAILED");

  const base = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  base.addColorStop(0, "#240042");
  base.addColorStop(0.3, "#4a1292");
  base.addColorStop(0.65, "#7b2cff");
  base.addColorStop(1, "#ad7cff");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 24; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = 40 + Math.random() * 180;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, "rgba(255,255,255,0.22)");
    glow.addColorStop(0.25, "rgba(212,180,255,0.15)");
    glow.addColorStop(1, "rgba(85,20,170,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 250; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 0.5 + Math.random() * 3.2;
    const alpha = 0.2 + Math.random() * 0.8;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    if (Math.random() > 0.82) {
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.55})`;
      ctx.lineWidth = Math.max(0.6, size * 0.4);
      ctx.beginPath();
      ctx.moveTo(x - size * 3.5, y);
      ctx.lineTo(x + size * 3.5, y);
      ctx.moveTo(x, y - size * 3.5);
      ctx.lineTo(x, y + size * 3.5);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function parseOBJToGeometry(THREE: any, text: string): any {
  const positions: number[][] = [];
  const normals: number[][] = [];
  const uvs: number[][] = [];
  const finalPositions: number[] = [];
  const finalNormals: number[] = [];
  const finalUvs: number[] = [];

  const lines = text.split(/\r?\n/);

  const resolveIndex = (index: string | undefined, listLength: number): number | null => {
    if (!index) return null;
    const parsed = Number(index);
    if (Number.isNaN(parsed)) return null;
    return parsed >= 0 ? parsed - 1 : listLength + parsed;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const parts = line.split(/\s+/);
    const type = parts[0];

    if (type === "v") {
      positions.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
    } else if (type === "vn") {
      normals.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
    } else if (type === "vt") {
      uvs.push([Number(parts[1]), Number(parts[2])]);
    } else if (type === "f") {
      const face = parts.slice(1).map((token) => {
        const [v, vt, vn] = token.split("/");
        return {
          v: resolveIndex(v, positions.length),
          vt: resolveIndex(vt, uvs.length),
          vn: resolveIndex(vn, normals.length),
        };
      });

      for (let i = 1; i < face.length - 1; i += 1) {
        const tri = [face[0], face[i], face[i + 1]];
        let computedNormal: any = null;

        if (tri.some((item) => item.vn == null)) {
          const a = positions[tri[0].v as number];
          const b = positions[tri[1].v as number];
          const c = positions[tri[2].v as number];
          const ab = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          const ac = new THREE.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
          computedNormal = new THREE.Vector3().crossVectors(ab, ac).normalize();
        }

        tri.forEach((item) => {
          const vertex = positions[item.v as number];
          finalPositions.push(vertex[0], vertex[1], vertex[2]);

          if (item.vn != null && normals[item.vn]) {
            finalNormals.push(normals[item.vn][0], normals[item.vn][1], normals[item.vn][2]);
          } else {
            finalNormals.push(computedNormal.x, computedNormal.y, computedNormal.z);
          }

          if (item.vt != null && uvs[item.vt]) {
            finalUvs.push(uvs[item.vt][0], 1 - uvs[item.vt][1]);
          } else {
            finalUvs.push(0, 0);
          }
        });
      }
    }
  }

  if (!finalPositions.length) {
    throw new Error("OBJ_PARSE_EMPTY");
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(finalPositions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(finalNormals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(finalUvs, 2));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const box = geometry.boundingBox;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  geometry.translate(-center.x, -center.y, -center.z);
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  const targetSize = 1.0;
  const scale = targetSize / maxAxis;
  geometry.scale(scale, scale, scale);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

function ErrorPopup({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;

  return (
    <div className="dice-error-backdrop" role="dialog" aria-modal="true" aria-label="Error message">
      <div className="dice-error-modal">
        <h3>{message}</h3>
        <button type="button" className="dice-error-modal__button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export function DicePage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();

  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const diceRef = useRef<any>(null);
  const ringRef = useRef<any>(null);
  const frameRef = useRef(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isMountedRef = useRef(true);
  const resultToastTimeoutRef = useRef<number | null>(null);
  const resultToastHideTimeoutRef = useRef<number | null>(null);
  const rollingNumberIntervalRef = useRef<number | null>(null);

  const rollStateRef = useRef<RollState>({
    active: false,
    startTime: 0,
    duration: 4000,
    finalFace: 1,
    settleFrom: { x: 0, y: 0, z: 0 },
  });

  const [mode, setMode] = useState<DiceMode>("demo");
  const [betAmount, setBetAmount] = useState<number | "">(DEFAULT_BET);
  const [target, setTarget] = useState(50);
  const [isRollOver, setIsRollOver] = useState(false);
  const [liveBalance, setLiveBalance] = useState(0);
  const [lastResult, setLastResult] = useState("-");
  const [history, setHistory] = useState<DiceHistoryEntry[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [threeReady, setThreeReady] = useState(false);

  const [stageResult, setStageResult] = useState<StageResultState>({
    visible: false,
    exiting: false,
    text: "",
    win: false,
  });

  const [stageRollingValue, setStageRollingValue] = useState("00.00");

  useEffect(() => {
    const parsed = Number(walletBalance);
    if (Number.isFinite(parsed)) {
      setLiveBalance(parsed);
    }
  }, [walletBalance]);

  const winChance = useMemo(() => getWinChance(target, isRollOver), [target, isRollOver]);
  const multiplier = useMemo(() => getMultiplier(winChance), [winChance]);
  const potentialReturn = useMemo(() => getPotentialProfit(Number(betAmount || 0), multiplier), [betAmount, multiplier]);
  const activeBalance = liveBalance;

  const clearStageResultTimers = useCallback(() => {
    if (resultToastTimeoutRef.current) {
      window.clearTimeout(resultToastTimeoutRef.current);
      resultToastTimeoutRef.current = null;
    }

    if (resultToastHideTimeoutRef.current) {
      window.clearTimeout(resultToastHideTimeoutRef.current);
      resultToastHideTimeoutRef.current = null;
    }
  }, []);

  const startRollingNumbers = useCallback(() => {
    if (rollingNumberIntervalRef.current) {
      window.clearInterval(rollingNumberIntervalRef.current);
    }

    rollingNumberIntervalRef.current = window.setInterval(() => {
      const randomValue = (Math.random() * 100).toFixed(2);
      setStageRollingValue(randomValue);
    }, 85);
  }, []);

  const stopRollingNumbers = useCallback((finalValue: number | string) => {
    if (rollingNumberIntervalRef.current) {
      window.clearInterval(rollingNumberIntervalRef.current);
      rollingNumberIntervalRef.current = null;
    }

    setStageRollingValue(Number(finalValue).toFixed(2));
  }, []);

  const showStageResult = useCallback(
    (roll: number, win: boolean) => {
      clearStageResultTimers();

      setStageResult({
        visible: true,
        exiting: false,
        text: `${win ? "WIN" : "LOSE"} ${Number(roll).toFixed(2)}`,
        win,
      });

      resultToastTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          setStageResult((prev) => ({
            ...prev,
            exiting: true,
          }));
        }

        resultToastHideTimeoutRef.current = window.setTimeout(() => {
          if (isMountedRef.current) {
            setStageResult((prev) => ({
              ...prev,
              visible: false,
              exiting: false,
            }));
          }
        }, 380);
      }, 3000);
    },
    [clearStageResultTimers],
  );

  const startRollAnimation = useCallback((face: number) => {
    const dice = diceRef.current;
    if (!dice) return;

    rollStateRef.current = {
      active: true,
      startTime: performance.now(),
      duration: 4000,
      finalFace: face,
      settleFrom: {
        x: dice.rotation.x,
        y: dice.rotation.y,
        z: dice.rotation.z,
      },
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearStageResultTimers();

      if (rollingNumberIntervalRef.current) {
        window.clearInterval(rollingNumberIntervalRef.current);
        rollingNumberIntervalRef.current = null;
      }
    };
  }, [clearStageResultTimers]);

  useEffect(() => {
    let cancelled = false;
    let renderer: any;
    let scene: any;
    const mountNode = mountRef.current;

    async function initThreeScene() {
      try {
        const THREE = await ensureThreeLoaded();
        if (cancelled || !mountRef.current) return;

        const objText = await fetch(DICE_OBJ_PATH, { cache: "no-store" }).then((res) => {
          if (!res.ok) throw new Error("OBJ_FETCH_FAILED");
          return res.text();
        });

        if (cancelled || !mountRef.current) return;

        scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        camera.position.set(0, 0.28, 5.7);
        cameraRef.current = camera;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
        rendererRef.current = renderer;

        mountRef.current.innerHTML = "";
        mountRef.current.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 1.95);
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
        keyLight.position.set(3.6, 4.5, 5.5);
        const fillLight = new THREE.PointLight(0xbc75ff, 20, 20, 2);
        fillLight.position.set(-2.8, 2.4, 3.2);
        const frontLight = new THREE.PointLight(0xffffff, 12, 18, 2);
        frontLight.position.set(0, 0.2, 5);
        const rimLight = new THREE.PointLight(0x9f5cff, 14, 22, 2);
        rimLight.position.set(0, 1.2, -4.5);
        scene.add(ambient, keyLight, fillLight, frontLight, rimLight);

        const geometry = parseOBJToGeometry(THREE, objText);
        const texture = createStarryDiceTexture(THREE);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1.15, 1.15);

        const material = new THREE.MeshPhysicalMaterial({
          map: texture,
          color: 0xffffff,
          emissive: 0x3b1072,
          emissiveIntensity: 0.58,
          roughness: 0.34,
          metalness: 0.08,
          clearcoat: 0.78,
          clearcoatRoughness: 0.18,
        });

        const diceMesh = new THREE.Mesh(geometry, material);
        diceMesh.castShadow = false;
        diceMesh.receiveShadow = false;
        diceMesh.rotation.set(-0.35, 0.68, 0.16);
        diceMesh.position.set(0, 0.02, 0);
        scene.add(diceMesh);
        diceRef.current = diceMesh;

        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.75, 0.065, 18, 96),
          new THREE.MeshBasicMaterial({ color: 0xaa63ff, transparent: true, opacity: 0.2 }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -1.2;
        scene.add(ring);
        ringRef.current = ring;

        const resize = () => {
          if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
          const { clientWidth, clientHeight } = mountRef.current;
          rendererRef.current.setSize(clientWidth, clientHeight, false);
          cameraRef.current.aspect = clientWidth / Math.max(clientHeight, 1);
          cameraRef.current.updateProjectionMatrix();
        };

        resize();
        resizeObserverRef.current = new ResizeObserver(resize);
        resizeObserverRef.current.observe(mountRef.current);

        const renderLoop = () => {
          frameRef.current = requestAnimationFrame(renderLoop);
          const dice = diceRef.current;
          const ringMesh = ringRef.current;
          const now = performance.now();
          const t = now * 0.001;

          if (dice) {
            const roll = rollStateRef.current;

            if (roll.active) {
              const progress = clamp((now - roll.startTime) / roll.duration, 0, 1);

              if (progress < 0.82) {
                const intensity = 1 - progress * 0.08;
                dice.rotation.x += 0.38 * intensity;
                dice.rotation.y += 0.52 * intensity;
                dice.rotation.z += 0.28 * intensity;
                dice.position.y = Math.sin(t * 18) * 0.12 + 0.08;
                dice.position.x = Math.sin(t * 9) * 0.045;
              } else {
                const settleProgress = (progress - 0.82) / 0.18;
                const eased = 1 - Math.pow(1 - settleProgress, 4);
                const targetEuler = getRotationForFace(roll.finalFace, THREE);
                dice.rotation.x = roll.settleFrom.x + (targetEuler.x - roll.settleFrom.x) * eased;
                dice.rotation.y = roll.settleFrom.y + (targetEuler.y - roll.settleFrom.y) * eased;
                dice.rotation.z = roll.settleFrom.z + (targetEuler.z - roll.settleFrom.z) * eased;
                dice.position.y = (1 - eased) * 0.05;
                dice.position.x = (1 - eased) * 0.015;
              }

              if (progress >= 1) {
                const targetEuler = getRotationForFace(roll.finalFace, THREE);
                dice.rotation.copy(targetEuler);
                dice.position.set(0, 0, 0);
                rollStateRef.current.active = false;
              }
            } else {
              dice.rotation.x += 0.0018;
              dice.rotation.y += 0.0024;
              dice.position.y = Math.sin(t * 1.4) * 0.07;
              dice.position.x = 0;
            }
          }

          if (ringMesh) {
            const active = rollStateRef.current.active;
            ringMesh.rotation.z += active ? 0.014 : 0.003;
            ringMesh.material.opacity = active
              ? 0.23 + ((Math.sin(t * 8) + 1) / 2) * 0.14
              : 0.14 + ((Math.sin(t * 2.1) + 1) / 2) * 0.09;
          }

          renderer.render(scene, camera);
        };

        renderLoop();
        if (isMountedRef.current) setThreeReady(true);
      } catch {
        if (!cancelled && isMountedRef.current) {
          setErrorMessage("Unable to load the dice model. Please confirm public/dice.obj exists and reload.");
        }
      }
    }

    void initThreeScene();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameRef.current);
      resizeObserverRef.current?.disconnect();
      if (renderer) renderer.dispose();
      if (mountNode) mountNode.innerHTML = "";
    };
  }, []);

  const pushHistory = useCallback((entry: DiceHistoryEntry) => {
    setHistory((prev) => [entry, ...prev].slice(0, 12));
  }, []);

  const settleRound = useCallback(
    ({ roll, balance, win, updateWallet }: { roll: number; balance: number; win: boolean; updateWallet: boolean }) => {
      setLastResult(win ? "WIN" : "LOSE");

      stopRollingNumbers(roll);
      showStageResult(roll, win);

      if (updateWallet) setLiveBalance(balance);
    },
    [showStageResult, stopRollingNumbers],
  );

  const runDemoRound = useCallback(async () => {
    const wager = Number(betAmount) || 0;
    if (wager <= 0) {
      setErrorMessage("Enter a valid bet amount before rolling.");
      return;
    }

    setIsRolling(true);
    setLastResult("Rolling...");
    setStageResult((prev) => ({ ...prev, visible: false, exiting: false }));
    setStageRollingValue("00.00");
    startRollingNumbers();

    try {
      const response = await placeDiceBet({
        mode: "demo",
        amount: wager.toFixed(8),
        target,
        rollOver: isRollOver,
      });

      const win = response.outcome === "win";
      const roll = response.roll;
      const payout = Number(response.payout || 0);

      startRollAnimation(getDiceFaceFromRoll(roll));
      await new Promise((resolve) => setTimeout(resolve, 4000));

      settleRound({ roll, balance: response.updatedBalance, win, updateWallet: false });
      pushHistory({
        id: `${Date.now()}-${roll}`,
        mode: "Demo",
        type: isRollOver ? "Roll Over" : "Roll Under",
        target,
        roll,
        win,
        amount: wager,
        payout,
      });
    } catch {
      stopRollingNumbers(stageRollingValue);
      setErrorMessage("AN ERROR OCCURED, PLEASE RELOAD AND TRY AGAIN");
    } finally {
      setIsRolling(false);
    }
  }, [
    betAmount,
    isRollOver,
    pushHistory,
    settleRound,
    stageRollingValue,
    startRollAnimation,
    startRollingNumbers,
    stopRollingNumbers,
    target,
  ]);

  const runLiveRound = useCallback(async () => {
    const wager = Number(betAmount) || 0;
    if (wager <= 0) {
      setErrorMessage("Enter a valid bet amount before rolling.");
      return;
    }
    if (wager > activeBalance) {
      setErrorMessage(formatInsufficientFundsMessage(wager, activeBalance));
      return;
    }

    try {
      setIsRolling(true);
      setLastResult("Rolling...");
      setStageResult((prev) => ({ ...prev, visible: false, exiting: false }));
      setStageRollingValue("00.00");
      startRollingNumbers();

      const response = await placeDiceBet({
        mode: "live",
        amount: wager.toFixed(8),
        target,
        rollOver: isRollOver,
      });

      startRollAnimation(getDiceFaceFromRoll(response.roll));
      await new Promise((resolve) => setTimeout(resolve, 4000));

      const didWin = response.outcome === "win";
      settleRound({ roll: response.roll, balance: response.updatedBalance, win: didWin, updateWallet: true });
      pushHistory({
        id: `${Date.now()}-${response.roll}`,
        mode: "Live",
        type: isRollOver ? "Roll Over" : "Roll Under",
        target,
        roll: Number(response.roll.toFixed(2)),
        win: didWin,
        amount: wager,
        payout: Number(response.payout || 0),
      });

      window.dispatchEvent(
        new CustomEvent("krabets:wallet-refresh", {
          detail: { reason: "bet_settled", game: "dice", outcome: response.outcome },
        }),
      );
    } catch (error) {
      stopRollingNumbers(stageRollingValue);
      setErrorMessage(resolveBetErrorMessage(error, "AN ERROR OCCURED, PLEASE RELOAD AND TRY AGAIN", {
        betAmount: wager,
        availableBalance: activeBalance,
      }));
    } finally {
      setIsRolling(false);
    }
  }, [
    activeBalance,
    betAmount,
    isRollOver,
    pushHistory,
    settleRound,
    stageRollingValue,
    startRollAnimation,
    startRollingNumbers,
    stopRollingNumbers,
    target,
  ]);

  const handleRoll = useCallback(() => {
    if (isRolling) return;
    if (mode === "demo") {
      void runDemoRound();
      return;
    }
    void runLiveRound();
  }, [isRolling, mode, runDemoRound, runLiveRound]);

  const adjustBet = (amount: number) => {
    setBetAmount((prev) => {
      const next = Number(prev) + amount;
      return next <= 0 ? 0.1 : Number(next.toFixed(2));
    });
  };

  const activeSideLabel = isRollOver ? "Over" : "Under";

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
            <div className="dice-game-shell">
              <ErrorPopup message={errorMessage} onClose={() => setErrorMessage("")} />

              <div className="dice-top-row">
                <div className="dice-mode-toggle">
                  <button type="button" className={mode === "demo" ? "active" : ""} onClick={() => setMode("demo")} disabled={isRolling}>
                    Demo
                  </button>
                  <button type="button" className={mode === "live" ? "active" : ""} onClick={() => setMode("live")} disabled={isRolling}>
                    Live
                  </button>
                </div>

                <div className="dice-status-pill">{isRolling ? "Rolling" : `${activeSideLabel} ${target.toFixed(2)}`}</div>
              </div>

              <div className="dice-main-grid">
                <section className="dice-display-card dice-grid-display">
                  <div className="dice-display-stage">
                    <div className="dice-background-glow" />

                    {stageResult.visible && !isRolling && (
                      <div
                        className={`dice-stage-result ${stageResult.win ? "win" : "lose"} ${
                          stageResult.exiting ? "hide" : "show"
                        }`}
                      >
                        {stageResult.text}
                      </div>
                    )}

                    <div className={`dice-stage-roll-value ${isRolling ? "rolling" : "settled"}`}>
                      {stageRollingValue}
                    </div>

                    <div ref={mountRef} className="dice-canvas-wrap" />
                    {!threeReady && <div className="dice-loading-state">Loading 3D dice...</div>}
                  </div>

                  <div className="dice-info-strip">
                    <div className="dice-info-box">
                      <span>Your Pick</span>
                      <strong>{isRollOver ? "Roll Over" : "Roll Under"}</strong>
                    </div>
                    <div className="dice-info-box">
                      <span>Last Result</span>
                      <strong>{lastResult}</strong>
                    </div>
                    <div className="dice-info-box">
                      <span>Win Return</span>
                      <strong>${formatAmount(potentialReturn)}</strong>
                    </div>
                  </div>
                </section>

                <aside className="dice-control-card dice-grid-controls">
                  <div className="dice-balance-row">
                    <div>
                      <div className="dice-small-label">Wallet Balance</div>
                      <div className="dice-balance-value">${formatAmount(activeBalance)}</div>
                    </div>
                    <div className="dice-odds-badge">{multiplier.toFixed(2)}x</div>
                  </div>

                  <div className="dice-form-block">
                    <div className="dice-field-label">Bet Type</div>
                    <div className="dice-segmented-row">
                      <button type="button" className={!isRollOver ? "active" : ""} disabled={isRolling} onClick={() => setIsRollOver(false)}>
                        Roll Under
                      </button>
                      <button type="button" className={isRollOver ? "active" : ""} disabled={isRolling} onClick={() => setIsRollOver(true)}>
                        Roll Over
                      </button>
                    </div>
                  </div>

                  <div className="dice-form-block">
                    <div className="dice-field-row">
                      <span className="dice-field-label">Target</span>
                      <span className="dice-inline-value">{target.toFixed(2)}</span>
                    </div>
                    <input
                      className="dice-range"
                      type="range"
                      min={MIN_TARGET}
                      max={MAX_TARGET}
                      step="0.01"
                      value={target}
                      disabled={isRolling}
                      onChange={(event) => setTarget(Number(event.target.value))}
                    />
                  </div>

                  <div className="dice-form-block">
                    <div className="dice-field-label">Bet Amount</div>
                    <div className="dice-bet-row">
                      <button type="button" className="dice-step-btn" disabled={isRolling} onClick={() => adjustBet(-1)}>
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={betAmount}
                        disabled={isRolling}
                        onChange={(event) => setBetAmount(event.target.value === "" ? "" : Number(event.target.value))}
                      />
                      <button type="button" className="dice-step-btn" disabled={isRolling} onClick={() => adjustBet(1)}>
                        +
                      </button>
                    </div>
                    <div className="dice-chip-row">
                      {[5, 10, 25, 50, "Max"].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          disabled={isRolling}
                          onClick={() => {
                            if (chip === "Max") {
                              setBetAmount(Number(activeBalance.toFixed(2)));
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

                  <div className="dice-summary-row">
                    <div className="dice-summary-box">
                      <span>Win Chance</span>
                      <strong>{winChance.toFixed(2)}%</strong>
                    </div>
                    <div className="dice-summary-box">
                      <span>Potential Return</span>
                      <strong>${formatAmount(potentialReturn)}</strong>
                    </div>
                  </div>

                  <button type="button" className="dice-roll-btn" disabled={isRolling || !threeReady} onClick={handleRoll}>
                    {isRolling ? "Rolling..." : mode === "demo" ? "Roll Dice" : "Roll Live"}
                  </button>
                </aside>

                <section className="dice-history-card dice-grid-history">
                  <div className="dice-card-header">
                    <h3>Recent Bet History</h3>
                    <span>{mode === "demo" ? "Demo mode" : "Live mode"}</span>
                  </div>

                  {history.length === 0 ? (
                    <div className="dice-empty-history">No rounds played yet.</div>
                  ) : (
                    <div className="dice-history-list">
                      {history.map((entry) => (
                        <div key={entry.id} className={`dice-history-item ${entry.win ? "win" : "lose"}`}>
                          <div>
                            <span>Mode</span>
                            <strong>{entry.mode}</strong>
                          </div>
                          <div>
                            <span>Bet</span>
                            <strong>{entry.type}</strong>
                          </div>
                          <div>
                            <span>Target / Roll</span>
                            <strong>
                              {entry.target.toFixed(2)} / {entry.roll.toFixed(2)}
                            </strong>
                          </div>
                          <div>
                            <span>Amount</span>
                            <strong>${formatAmount(entry.amount)}</strong>
                          </div>
                          <div>
                            <span>Payout</span>
                            <strong>{entry.win ? `$${formatAmount(entry.payout)}` : "0.00"}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="dice-guide-card dice-grid-guide">
                  <div className="dice-card-header">
                    <h3>How to Play Dice</h3>
                    <span>Quick guide</span>
                  </div>
                  <div className="dice-guide-list">
                    <p>
                      Choose <code>Roll Under</code> or <code>Roll Over</code>, then set your target number.
                    </p>
                    <p>Lower win chance gives a higher multiplier, based on the BC-style dice formula.</p>
                    <p>Set your wager, press Roll, and wait for the dice to animate for 4 seconds before the result settles.</p>
                    <p>Demo mode uses local logic. Live mode uses backend settlement and updates the wallet.</p>
                    <p>If live integration fails, the game shows the required error popup instead of faking a result.</p>
                  </div>
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
