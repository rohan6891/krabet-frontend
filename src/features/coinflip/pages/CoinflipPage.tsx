"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from "react";
import "@/features/dashboard/pages/DashboardPage.css";
import "./CoinflipPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { GameChatOverlay } from "@/features/chat/components/GameChatOverlay";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { placeCoinflipBet } from "@/features/coinflip/api/coinflip.api";
import { formatInsufficientFundsMessage, resolveBetErrorMessage } from "@/shared/utils/bettingErrors";
import type { CoinSide, CoinflipMode, CoinflipOutcome } from "@/features/coinflip/types/coinflip.types";
import { LiveBetsTable } from "@/shared/ui/LiveBetsTable/LiveBetsTable";

declare global {
  interface Window {
    THREE?: any;
  }
}

const DEFAULT_BALANCE = 0;
const MIN_BET = 1;
const QUICK_AMOUNTS = [5, 10, 25, 50];
const FLIP_DURATION = 2.55;
const THREE_CDN = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js";

function formatMoney(value: number): string {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function createHistoryEntry(params: {
  mode: CoinflipMode;
  choice: CoinSide;
  outcomeSide: CoinSide;
  outcome: CoinflipOutcome;
  amount: number;
  payout: number;
}): {
  id: string;
  mode: "Demo" | "Live";
  choice: CoinSide;
  outcome: CoinSide;
  amount: number;
  payout: number;
  status: "win" | "lose";
} {
  const status = params.outcome === "win" ? "win" : "lose";
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    mode: params.mode === "demo" ? "Demo" : "Live",
    choice: params.choice,
    outcome: params.outcomeSide,
    amount: params.amount,
    payout: params.payout,
    status,
  };
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function loadScript(src: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.THREE) {
      resolve(window.THREE);
      return;
    }

    const existing = document.querySelector(`script[data-cdn-src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.THREE), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.cdnSrc = src;
    script.onload = () => resolve(window.THREE);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function createEdgeStripeTexture(THREE: any) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#f7d77a");
  grad.addColorStop(0.55, "#bc8722");
  grad.addColorStop(1, "#f2ca67");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < canvas.width; i += 16) {
    ctx.fillStyle = i % 32 === 0 ? "rgba(255,245,190,0.85)" : "rgba(130,90,18,0.65)";
    ctx.fillRect(i, 0, 6, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(36, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createGoldFaceTexture(THREE: any) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  const radial = ctx.createRadialGradient(370, 330, 30, 512, 512, 510);
  radial.addColorStop(0, "#ffe49a");
  radial.addColorStop(0.58, "#dfa83e");
  radial.addColorStop(1, "#9a6a16");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 233, 166, 0.85)";
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.arc(512, 512, 476, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(136, 89, 18, 0.75)";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(512, 512, 430, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function CoinWebGL({ result, flipSignal, onFlipDone }: { result: CoinSide; flipSignal: number; onFlipDone: () => void }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<any>(null);
  const onFlipDoneRef = useRef(onFlipDone);
  const flipRef = useRef({
    isRunning: false,
    startTime: 0,
    result: "heads" as CoinSide,
    finished: false,
  });

  useEffect(() => {
    onFlipDoneRef.current = onFlipDone;
  }, [onFlipDone]);

  useEffect(() => {
    let destroyed = false;

    async function init() {
      const THREE = await loadScript(THREE_CDN);
      if (!THREE || destroyed || !mountRef.current) return;

      const mount = mountRef.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(29, Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1), 0.1, 100);
      camera.position.set(0, 0.15, 7.35);
      camera.lookAt(0, 0.08, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xfff4ce, 0x2d1a05, 1.45));
      const keyLight = new THREE.DirectionalLight(0xfff0c1, 3.6);
      keyLight.position.set(5.6, 4.4, 6.2);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      scene.add(keyLight);

      const fillLight = new THREE.PointLight(0xffcf66, 1.75, 30);
      fillLight.position.set(-3.2, 1.7, 3.8);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffe39a, 1.3);
      rimLight.position.set(-3, 1.5, -4.5);
      scene.add(rimLight);

      const floorShadow = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.ShadowMaterial({ opacity: 0.14 }));
      floorShadow.rotation.x = -Math.PI / 2;
      floorShadow.position.set(0, -1.45, 0);
      floorShadow.receiveShadow = true;
      scene.add(floorShadow);

      const loader = new THREE.TextureLoader();
      const loadTexture = (src: string) =>
        new Promise<any>((resolve, reject) => {
          loader.load(
            src,
            (texture: any) => {
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.anisotropy = 12;
              texture.needsUpdate = true;
              resolve(texture);
            },
            undefined,
            reject,
          );
        });

      const [headMap, tailMap] = await Promise.all([loadTexture("/coin-head.png"), loadTexture("/coin-tail.png")]);
      if (destroyed) return;

      const edgeTexture = createEdgeStripeTexture(THREE);
      const goldFaceTexture = createGoldFaceTexture(THREE);

      const root = new THREE.Group();
      root.position.set(0, -0.25, 0);
      scene.add(root);

      const fakeShadow = new THREE.Mesh(new THREE.CircleGeometry(1.15, 64), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.34, depthWrite: false }));
      fakeShadow.rotation.x = -Math.PI / 2;
      fakeShadow.position.set(0, -1.18, 0);
      root.add(fakeShadow);

      const coinGroup = new THREE.Group();
      root.add(coinGroup);

      const edgeMat = new THREE.MeshPhysicalMaterial({
        color: 0xf0c44f,
        metalness: 1,
        roughness: 0.18,
        clearcoat: 0.62,
        clearcoatRoughness: 0.12,
        map: edgeTexture,
        bumpMap: edgeTexture,
        bumpScale: 0.035,
      });

      const faceMatFront = new THREE.MeshPhysicalMaterial({ color: 0xf7cd65, metalness: 1, roughness: 0.21, clearcoat: 0.64, clearcoatRoughness: 0.11, map: goldFaceTexture });
      const faceMatBack = new THREE.MeshPhysicalMaterial({ color: 0xf7cd65, metalness: 1, roughness: 0.21, clearcoat: 0.64, clearcoatRoughness: 0.11, map: goldFaceTexture });

      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.22, 160, 1, false), [edgeMat, faceMatFront, faceMatBack]);
      cylinder.rotation.x = Math.PI / 2;
      cylinder.castShadow = true;
      cylinder.receiveShadow = true;
      coinGroup.add(cylinder);

      const emblemFront = new THREE.Mesh(
        new THREE.CircleGeometry(0.985, 160),
        new THREE.MeshBasicMaterial({
          map: headMap,
          transparent: true,
          alphaTest: 0.01,
          color: 0xffffff,
          depthWrite: false,
          toneMapped: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
      );
      emblemFront.position.set(0, 0, 0.1125);
      emblemFront.renderOrder = 2;
      coinGroup.add(emblemFront);

      const emblemBack = new THREE.Mesh(
        new THREE.CircleGeometry(0.985, 160),
        new THREE.MeshBasicMaterial({
          map: tailMap,
          transparent: true,
          alphaTest: 0.01,
          color: 0xffffff,
          depthWrite: false,
          toneMapped: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
      );
      emblemBack.position.set(0, 0, -0.1125);
      emblemBack.rotation.y = Math.PI;
      emblemBack.renderOrder = 2;
      coinGroup.add(emblemBack);

      const frontFace = new THREE.Mesh(new THREE.CircleGeometry(1, 128), faceMatFront);
      frontFace.position.set(0, 0, 0.1115);
      coinGroup.add(frontFace);
      const backFace = new THREE.Mesh(new THREE.CircleGeometry(1, 128), faceMatBack);
      backFace.position.set(0, 0, -0.1115);
      backFace.rotation.y = Math.PI;
      coinGroup.add(backFace);

      coinGroup.rotation.x = -0.05;
      coinGroup.rotation.y = result === "tails" ? Math.PI : 0;

      const resize = () => {
        if (!mountRef.current) return;
        const width = Math.max(mountRef.current.clientWidth, 1);
        const height = Math.max(mountRef.current.clientHeight, 1);
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const renderLoop = (now: number) => {
        if (destroyed) return;

        const flip = flipRef.current;
        if (flip.isRunning) {
          const raw = Math.min((now - flip.startTime) / (FLIP_DURATION * 1000), 1);
          const t = easeInOutCubic(raw);
          const totalTurns = flip.result === "heads" ? 7 : 7.5;
          const spinY = t * totalTurns * Math.PI * 2;

          const arcLift = Math.sin(Math.PI * t);
          const settle = (1 - t) * (1 - t);
          const liftScale = 0.92 + arcLift * 0.26;
          const forwardZ = arcLift * 0.26;
          const wobble = arcLift * settle;

          coinGroup.position.set(0, 0, forwardZ);
          coinGroup.scale.set(liftScale, liftScale, liftScale);
          coinGroup.rotation.x = -0.045 + wobble * 0.08;
          coinGroup.rotation.y = spinY;
          coinGroup.rotation.z = wobble * 0.048;

          fakeShadow.scale.set(1 + arcLift * 0.95, 1 + arcLift * 0.45, 1);
          fakeShadow.material.opacity = 0.34 - arcLift * 0.16;

          if (raw >= 1 && !flip.finished) {
            flip.finished = true;
            flip.isRunning = false;

            coinGroup.position.set(0, 0, 0);
            coinGroup.scale.set(1, 1, 1);
            coinGroup.rotation.x = -0.05;
            coinGroup.rotation.y = flip.result === "tails" ? Math.PI : 0;
            coinGroup.rotation.z = 0;

            fakeShadow.scale.set(1, 1, 1);
            fakeShadow.material.opacity = 0.34;

            requestAnimationFrame(() => {
              if (onFlipDoneRef.current) onFlipDoneRef.current();
            });
          }
        }

        renderer.render(scene, camera);
        engineRef.current.frameId = requestAnimationFrame(renderLoop);
      };

      window.addEventListener("resize", resize);
      resize();

      engineRef.current = {
        renderer,
        mount,
        frameId: requestAnimationFrame(renderLoop),
        dispose() {
          window.removeEventListener("resize", resize);
          cancelAnimationFrame(engineRef.current?.frameId);
          edgeTexture.dispose();
          goldFaceTexture.dispose();
          headMap.dispose();
          tailMap.dispose();
          renderer.dispose();
          if (renderer.domElement.parentNode === mount) {
            mount.removeChild(renderer.domElement);
          }
        },
      };
    }

    init();

    return () => {
      destroyed = true;
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [result]);

  useEffect(() => {
    if (!flipSignal) return;
    flipRef.current.startTime = performance.now();
    flipRef.current.isRunning = true;
    flipRef.current.result = result;
    flipRef.current.finished = false;
  }, [flipSignal, result]);

  return <div ref={mountRef} className="cf-webgl-canvas" />;
}

export function CoinflipPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();

  const [mode, setMode] = useState<CoinflipMode>("live");
  const [liveBalance, setLiveBalance] = useState(DEFAULT_BALANCE);
  const [betAmount, setBetAmount] = useState("10.00");
  const [selectedSide, setSelectedSide] = useState<CoinSide>("heads");
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastResult, setLastResult] = useState("-");
  const [history, setHistory] = useState<Array<ReturnType<typeof createHistoryEntry>>>([]);
  const [popupMessage, setPopupMessage] = useState("");
  const [bannerText, setBannerText] = useState("");
  const [bannerType, setBannerType] = useState("");
  const [resolvedOutcome, setResolvedOutcome] = useState<CoinSide>("heads");
  const [flipSignal, setFlipSignal] = useState(0);

  const [pendingEntry, setPendingEntry] = useState<ReturnType<typeof createHistoryEntry> | null>(null);
  const [pendingBalanceOverride, setPendingBalanceOverride] = useState<number | null>(null);
  const [pendingMode, setPendingMode] = useState<CoinflipMode>("live");
  const [pendingOutcome, setPendingOutcome] = useState<CoinflipOutcome | null>(null);

  const bannerTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isFlipping) return;
    const parsed = Number(walletBalance);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Number.isFinite(parsed)) setLiveBalance(parsed);
  }, [walletBalance, isFlipping]);

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) window.clearTimeout(bannerTimeoutRef.current);
    };
  }, []);

  const numericBet = useMemo(() => {
    const parsed = parseFloat(betAmount);
    if (Number.isNaN(parsed)) return 0;
    return parsed;
  }, [betAmount]);

  const activeBalance = liveBalance;

  const potentialReturn = numericBet > 0 ? numericBet * 2 : 0;
  const canPlay = !isFlipping && numericBet >= MIN_BET && Number.isFinite(numericBet);

  function clearBanner() {
    if (bannerTimeoutRef.current) window.clearTimeout(bannerTimeoutRef.current);
    setBannerText("");
    setBannerType("");
  }

  function showBanner(status: "win" | "lose") {
    clearBanner();
    setBannerText(status === "win" ? "WINNER" : "LOSER");
    setBannerType(status);

    bannerTimeoutRef.current = window.setTimeout(() => {
      setBannerText("");
      setBannerType("");
    }, 1700);
  }

  function setQuickBet(value: number) {
    if (isFlipping) return;
    setBetAmount(Number(value).toFixed(2));
  }

  function nudgeBet(direction: "up" | "down") {
    if (isFlipping) return;
    const current = numericBet || 0;
    const next = direction === "up" ? current + 1 : current - 1;
    setBetAmount(Math.max(MIN_BET, next).toFixed(2));
  }

  function startResolvedFlip(input: {
    mode: CoinflipMode;
    outcome: CoinSide;
    outcomeType: CoinflipOutcome;
    entry: ReturnType<typeof createHistoryEntry>;
    balanceOverride?: number | null;
  }) {
    setPendingMode(input.mode);
    setPendingOutcome(input.outcomeType);
    setPendingEntry(input.entry);
    setPendingBalanceOverride(input.balanceOverride ?? null);
    setResolvedOutcome(input.outcome);
    setLastResult("-");
    setIsFlipping(true);
    setFlipSignal((prev) => prev + 1);
  }

  function onFlipFinished() {
    setIsFlipping(false);

    if (!pendingEntry) return;

    setLastResult(pendingEntry.outcome);
    setHistory((prev) => [pendingEntry, ...prev].slice(0, 12));

    if (typeof pendingBalanceOverride === "number") {
      if (pendingMode === "live") {
        setLiveBalance(pendingBalanceOverride);
      }
    } else if (pendingEntry.status === "win") {
      if (pendingMode === "live") {
        setLiveBalance((prev) => prev + pendingEntry.amount * 2);
      }
    }

    showBanner(pendingEntry.status);
    if (pendingMode === "live" && pendingOutcome) {
      window.dispatchEvent(
        new CustomEvent("krabets:wallet-refresh", {
          detail: {
            reason: "bet_settled",
            game: "coinflip",
            outcome: pendingOutcome,
          },
        }),
      );
    }
    setPendingEntry(null);
    setPendingBalanceOverride(null);
    setPendingOutcome(null);
  }

  async function playRound() {
    if (!canPlay) return;
    clearBanner();

    if (mode === "live" && numericBet > activeBalance) {
      setPopupMessage(formatInsufficientFundsMessage(numericBet, activeBalance));
      return;
    }

    try {
      const response = await placeCoinflipBet({
        mode,
        amount: numericBet.toFixed(8),
        choice: selectedSide,
      });

      const outcomeSide = response.outcomeSide;
      const entry = createHistoryEntry({
        mode,
        choice: selectedSide,
        outcomeSide,
        outcome: response.outcome,
        amount: numericBet,
        payout: response.payout,
      });

      startResolvedFlip({
        mode,
        outcome: outcomeSide,
        outcomeType: response.outcome,
        entry,
        balanceOverride: response.updatedBalance,
      });
    } catch (error) {
      const message = resolveBetErrorMessage(error, "Unable to play Coinflip.", {
        betAmount: numericBet,
        availableBalance: activeBalance,
      });
      setPopupMessage(message);
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
            walletBalance={formatMoney(liveBalance)}
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
            <div className="coinflip-shell">
              <div className="coinflip-layout">
                <section className="coinflip-left">
                  <div className="cf-panel cf-stage-panel">
                    <div className="cf-stage-topbar">
                      <div className="cf-mode-switch">
                        <button
                          type="button"
                          className={`cf-mode-btn ${mode === "demo" ? "active" : ""}`}
                          onClick={() => setMode("demo")}
                        >
                          Demo
                        </button>
                        <button
                          type="button"
                          className={`cf-mode-btn ${mode === "live" ? "active" : ""}`}
                          onClick={() => setMode("live")}
                        >
                          Live
                        </button>
                      </div>

                      <div className={`cf-status-pill ${isFlipping ? "busy" : ""}`}>
                        {isFlipping ? "Flipping" : "Ready"}
                      </div>
                    </div>

                    <div className={`cf-stage ${isFlipping ? "is-flipping" : ""}`}>
                      <div className="cf-stage-bg" style={{ backgroundImage: `url("/coin-table.png")` }} />
                      <div className="cf-stage-blur-layer" />

                      <div className={`cf-result-banner ${bannerType ? `show ${bannerType}` : ""}`}>
                        <span>{bannerText}</span>
                      </div>

                      <div className="cf-stage-center">
                        <div className="cf-webgl-wrap">
                          <CoinWebGL result={resolvedOutcome} flipSignal={flipSignal} onFlipDone={onFlipFinished} />
                        </div>
                      </div>

                      <div className="cf-stage-stats">
                        <div className="cf-stat-card">
                          <span className="cf-stat-label">Your Pick</span>
                          <strong className="cf-stat-value">{selectedSide}</strong>
                        </div>
                        <div className="cf-stat-card">
                          <span className="cf-stat-label">Last Result</span>
                          <strong className="cf-stat-value">{lastResult}</strong>
                        </div>
                        <div className="cf-stat-card">
                          <span className="cf-stat-label">Win Return</span>
                          <strong className="cf-stat-value">${formatMoney(potentialReturn)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="cf-panel cf-history-panel">
                    <div className="cf-section-head">
                      <h3>Recent Bet History</h3>
                      <span>{mode === "demo" ? "Demo mode" : "Live mode"}</span>
                    </div>

                    <div className="cf-history-list">
                      {history.length === 0 ? (
                        <div className="cf-empty-state">No rounds played yet.</div>
                      ) : (
                        history.map((item) => (
                          <div className="cf-history-row" key={item.id}>
                            <div className="cf-history-cell">
                              <span className="cf-history-key">Mode</span>
                              <strong>{item.mode}</strong>
                            </div>
                            <div className="cf-history-cell">
                              <span className="cf-history-key">Pick</span>
                              <strong>{item.choice}</strong>
                            </div>
                            <div className="cf-history-cell">
                              <span className="cf-history-key">Result</span>
                              <strong>{item.outcome}</strong>
                            </div>
                            <div className="cf-history-cell">
                              <span className="cf-history-key">Bet</span>
                              <strong>${formatMoney(item.amount)}</strong>
                            </div>
                            <div className="cf-history-cell">
                              <span className="cf-history-key">Payout</span>
                              <strong>${formatMoney(item.payout)}</strong>
                            </div>
                            <div className={`cf-history-badge ${item.status}`}>
                              {item.status === "win" ? "Won" : "Lost"}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <LiveBetsTable variant="game" />
                </section>

                <aside className="coinflip-right">
                  <div className="cf-panel cf-controls-panel">
                    <div className="cf-balance-top">
                      <div>
                        <span className="cf-mini-label">Balance</span>
                        <h2>${formatMoney(activeBalance)}</h2>
                      </div>
                      <div className="cf-odds-pill">2.00x</div>
                    </div>

                    <div className="cf-control-block">
                      <label className="cf-block-title">Choose Side</label>
                      <div className="cf-side-buttons">
                        <button type="button" className={selectedSide === "heads" ? "active" : ""} onClick={() => setSelectedSide("heads")} disabled={isFlipping}>
                          Heads
                        </button>
                        <button type="button" className={selectedSide === "tails" ? "active" : ""} onClick={() => setSelectedSide("tails")} disabled={isFlipping}>
                          Tails
                        </button>
                      </div>
                    </div>

                    <div className="cf-control-block">
                      <label className="cf-block-title">Bet Amount</label>

                      <div className="cf-bet-input-wrap">
                        <button type="button" className="cf-step-btn" onClick={() => nudgeBet("down")} disabled={isFlipping}>
                          -
                        </button>

                        <input
                          type="text"
                          value={betAmount}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                              setBetAmount(value);
                            }
                          }}
                          disabled={isFlipping}
                          inputMode="decimal"
                          aria-label="Bet amount"
                        />

                        <button type="button" className="cf-step-btn" onClick={() => nudgeBet("up")} disabled={isFlipping}>
                          +
                        </button>
                      </div>

                      <div className="cf-quick-row">
                        {QUICK_AMOUNTS.map((amount) => (
                          <button type="button" key={amount} onClick={() => setQuickBet(amount)} disabled={isFlipping}>
                            {amount}
                          </button>
                        ))}
                          <button type="button" onClick={() => setQuickBet(mode === "demo" ? 1000 : activeBalance)} disabled={isFlipping || (mode === "live" && activeBalance <= 0)}>
                          Max
                        </button>
                      </div>
                    </div>

                    <div className="cf-summary-grid">
                      <div className="cf-summary-card">
                        <span>Odds</span>
                        <strong>2.00x</strong>
                      </div>
                      <div className="cf-summary-card">
                        <span>Potential Return</span>
                        <strong>${formatMoney(potentialReturn)}</strong>
                      </div>
                    </div>

                    <button type="button" className="cf-play-btn" onClick={playRound} disabled={!canPlay}>
                      {isFlipping ? "Flipping..." : "Flip Coin"}
                    </button>
                  </div>

                  <div className="cf-panel cf-how-panel">
                    <div className="cf-section-head">
                      <h3>How to Play Coin Flip</h3>
                      <span>Quick guide</span>
                    </div>

                    <div className="cf-how-list">
                      <p>Pick Heads or Tails before you place your bet.</p>
                      <p>Enter your wager amount using the controls.</p>
                      <p>Press Flip Coin and watch the 3D coin animation settle on a side.</p>
                      <p>If the final result matches your pick, the round pays 2.00x.</p>
                      <p>Use the history panel to review your latest rounds.</p>
                    </div>
                  </div>
                </aside>
              </div>

              {popupMessage && (
                <div className="cf-popup-overlay" onClick={() => setPopupMessage("")}>
                  <div
                    className="cf-popup-card"
                    onClick={(event) => event.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Error message"
                  >
                    <h3>{popupMessage}</h3>
                    <button type="button" className="cf-popup-button" onClick={() => setPopupMessage("")}>Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <GameChatOverlay roomCode="coinflip" />
          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
