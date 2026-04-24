"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { apiRequest } from "@/shared/api/http";
import { env } from "@/shared/config/env";
import { getAccessTokenFromStorage } from "@/shared/utils/session";
import "./LiveBetsTable.css";
import { useLiveFeed, LiveFeedEntry } from "@/shared/hooks/useLiveFeed";

interface LiveBetsTableProps {
  variant: "dashboard" | "game";
}

type TabType = "casino" | "sports" | "race" | "my-bets" | "all-bets" | "high-rollers";

export function LiveBetsTable({ variant }: LiveBetsTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>(
    variant === "dashboard" ? "casino" : "all-bets"
  );
  const [rowCount, setRowCount] = useState(10);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [myBets, setMyBets] = useState<LiveFeedEntry[]>([]);
  const [myBetsLoading, setMyBetsLoading] = useState(false);
  
  const { entries: allLiveEntries, loading: liveLoading } = useLiveFeed(50);

  // Fetch My Bets
  const fetchMyBets = useCallback(async () => {
    try {
      const token = getAccessTokenFromStorage();
      if (!token) return;

      setMyBetsLoading(true);
      const response = await apiRequest<{ success?: boolean; data: { bets: any[] } }>(
        env.apiBaseUrl,
        "/api/v1/bets/history",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Map backend bet history to LiveFeedEntry format
      const bets = response.data?.bets || [];
      const mapped: LiveFeedEntry[] = bets.map((b) => ({
        user_id: b.userId || b.user_id,
        username: "You",
        game: b.game_code || b.gameCode || b.game || "Crash",
        bet: b.betAmount || b.bet_amount || "0",
        payout: b.payoutAmount || b.payout || "0",
        multiplier: b.multiplier || "0",
        event_type: (b.outcome === "win" || b.status === "won") ? "bet_won" : "bet_created",
        timestamp: b.createdAt || b.created_at || new Date().toISOString(),
      }));
      setMyBets(mapped);
    } catch (err) {
      console.error("[LiveBetsTable] Failed to fetch my bets:", err);
    } finally {
      setMyBetsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "my-bets") {
      fetchMyBets();
    }
  }, [activeTab, fetchMyBets]);

  // Derived Data
  const displayedEntries = useMemo(() => {
    let base: LiveFeedEntry[] = [];
    if (activeTab === "casino" || activeTab === "all-bets") {
      base = allLiveEntries;
    } else if (activeTab === "my-bets") {
      base = myBets;
    } else if (activeTab === "high-rollers") {
      // Filter for bets > 500 (arbitrary high roller threshold)
      base = allLiveEntries.filter((e) => parseFloat(e.bet) > 500 || parseFloat(e.payout) > 1000);
    }

    return base.slice(0, rowCount);
  }, [activeTab, allLiveEntries, myBets, rowCount]);

  const isLoading = (activeTab === "my-bets" ? myBetsLoading : liveLoading);
  const isComingSoon = activeTab === "sports" || activeTab === "race";

  const formatTime = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  const formatValue = (val: string) => {
    const n = parseFloat(val);
    return isNaN(n) ? "0.00" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

  const getCoinIcon = (game: string) => {
    // Defaulting to USDT icon for now as it's the most common in the UI
    return "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=025";
  };

  const getGameIcon = (game: string) => {
    const g = game.toLowerCase();
    if (g.includes("crash")) return <i className="fa-solid fa-chart-line"></i>;
    if (g.includes("mines")) return <i className="fa-solid fa-bomb"></i>;
    if (g.includes("dice")) return <i className="fa-solid fa-dice"></i>;
    if (g.includes("keno")) return <i className="fa-solid fa-grid-9"></i>;
    if (g.includes("plinko")) return <i className="fa-solid fa-ball-pile"></i>;
    if (g.includes("limbo")) return <i className="fa-solid fa-rocket"></i>;
    if (g.includes("coinflip")) return <i className="fa-solid fa-coins"></i>;
    return <i className="fa-solid fa-gamepad"></i>;
  };

  return (
    <div className="live-bets-container">
      <div className="lbt-tabs-header">
        <div className="lbt-tabs">
          {variant === "dashboard" ? (
            <>
              <div className={`lbt-tab ${activeTab === "casino" ? "active" : ""}`} onClick={() => setActiveTab("casino")}>Casino Bets</div>
              <div className={`lbt-tab ${activeTab === "sports" ? "active" : ""}`} onClick={() => setActiveTab("sports")}>Sports Bets</div>
              <div className={`lbt-tab ${activeTab === "race" ? "active" : ""}`} onClick={() => setActiveTab("race")}>Race Leaderboard</div>
            </>
          ) : (
            <>
              <div className={`lbt-tab ${activeTab === "my-bets" ? "active" : ""}`} onClick={() => setActiveTab("my-bets")}>My Bets</div>
              <div className={`lbt-tab ${activeTab === "all-bets" ? "active" : ""}`} onClick={() => setActiveTab("all-bets")}>All Bets</div>
              <div className={`lbt-tab ${activeTab === "high-rollers" ? "active" : ""}`} onClick={() => setActiveTab("high-rollers")}>High Rollers</div>
              <div className={`lbt-tab ${activeTab === "race" ? "active" : ""}`} onClick={() => setActiveTab("race")}>Race Leaderboard</div>
            </>
          )}
        </div>

        <div className="lbt-controls">
          <div className="lbt-ghost-toggle" onClick={() => setIsGhostMode(!isGhostMode)}>
            <i className={`fa-solid ${isGhostMode ? "fa-toggle-on" : "fa-toggle-off"}`} style={{ color: isGhostMode ? "#a855ff" : "" }}></i>
            <span>Ghost Mode</span>
          </div>
          <select className="lbt-select" value={rowCount} onChange={(e) => setRowCount(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="lbt-table-wrapper">
        {isComingSoon ? (
          <div className="lbt-empty-state">
            <div className="lbt-empty-icon">
              <i className="fa-solid fa-rocket-launch"></i>
            </div>
            <h3>Coming Soon</h3>
            <p>We are currently working hard to bring this feature to our players. Stay tuned!</p>
          </div>
        ) : (
          <table className="lbt-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>User</th>
                <th>Time</th>
                <th>Bet Amount</th>
                <th>Multiplier</th>
                <th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: rowCount }).map((_, i) => (
                  <tr key={i} className="lbt-row">
                    <td><div className="lbt-skeleton" style={{ width: "80px" }}></div></td>
                    <td><div className="lbt-skeleton" style={{ width: "100px" }}></div></td>
                    <td><div className="lbt-skeleton" style={{ width: "60px" }}></div></td>
                    <td><div className="lbt-skeleton" style={{ width: "90px" }}></div></td>
                    <td><div className="lbt-skeleton" style={{ width: "40px" }}></div></td>
                    <td><div className="lbt-skeleton" style={{ width: "90px" }}></div></td>
                  </tr>
                ))
              ) : displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#8a78a8" }}>
                    No bets found
                  </td>
                </tr>
              ) : (
                displayedEntries.map((entry, idx) => {
                  const payoutNum = parseFloat(entry.payout);
                  const isWin = payoutNum > 0;
                  const displayUsername = isGhostMode ? "Hidden" : entry.username;
                  
                  return (
                    <tr key={`${entry.timestamp}-${idx}`} className="lbt-row">
                      <td>
                        <div className="lbt-col-game">
                          <span className="lbt-game-icon-wrap">{getGameIcon(entry.game)}</span>
                          <span style={{ textTransform: "capitalize" }}>{entry.game}</span>
                        </div>
                      </td>
                      <td>
                        <div className="lbt-user-cell">
                          {isGhostMode && <i className="fa-solid fa-user-secret lbt-ghost-icon"></i>}
                          <span>{displayUsername}</span>
                        </div>
                      </td>
                      <td>{formatTime(entry.timestamp)}</td>
                      <td>
                        <div className="lbt-amount-cell">
                          <span>{formatValue(entry.bet)}</span>
                          <img src={getCoinIcon(entry.game)} alt="coin" className="lbt-coin-icon" />
                        </div>
                      </td>
                      <td>{parseFloat(entry.multiplier).toFixed(2)}x</td>
                      <td>
                        <div className={`lbt-payout-cell ${isWin ? "lbt-payout-win" : "lbt-payout-loss"}`}>
                          <span>{isWin ? "+" : ""}{formatValue(entry.payout)}</span>
                          <img src={getCoinIcon(entry.game)} alt="coin" className="lbt-coin-icon" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
