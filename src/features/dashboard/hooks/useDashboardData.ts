"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { env } from "@/shared/config/env";
import { getAccessTokenFromStorage, getStoredSession } from "@/shared/utils/session";
import {
  fetchDashboardGames,
  fetchMe,
  fetchRecentWins,
  fetchWalletBalance,
} from "@/features/dashboard/api/dashboard.api";
import type { DashboardGame, DashboardWin } from "@/features/dashboard/types/dashboard.types";

type DashboardProfile = {
  username: string;
  email: string;
  avatarUrl: string | null;
};

function pickPreferredWalletBalance(wallets: Array<{ currency?: string; availableBalance: string }>): string {
  const preferredWallet = wallets.find((wallet) => wallet.currency === "USDT") || wallets[0];
  return preferredWallet?.availableBalance || "0.00";
}

function withApiBase(path?: string): string {
  if (!path) {
    return "";
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${env.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function withImageProxy(path?: string): string {
  const resolvedUrl = withApiBase(path);
  if (!resolvedUrl) {
    return "";
  }

  if (/https?:\/\/[^/]*\.ngrok(?:-free)?\.(?:app|dev|io)/i.test(resolvedUrl)) {
    return `/api/media?url=${encodeURIComponent(resolvedUrl)}`;
  }

  return resolvedUrl;
}

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<DashboardGame[]>([]);
  const [recentWins, setRecentWins] = useState<DashboardWin[]>([]);
  const [walletBalance, setWalletBalance] = useState("0.00");
  const [profile, setProfile] = useState<DashboardProfile>({
    username: "User",
    email: "",
    avatarUrl: null,
  });

  const refreshWalletBalance = useCallback(async () => {
    const token = getAccessTokenFromStorage();
    if (!token) return;

    try {
      const walletRes = await fetchWalletBalance(token);
      const wallets = walletRes.data.wallets || [];
      setWalletBalance(pickPreferredWalletBalance(wallets));
    } catch {
      // silently ignore transient realtime refresh failures
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      const token = getAccessTokenFromStorage();
      if (!token) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const [gamesRes, winsRes, walletRes, meRes] = await Promise.all([
          fetchDashboardGames(),
          fetchRecentWins(),
          fetchWalletBalance(token),
          fetchMe(token),
        ]);

        if (!mounted) {
          return;
        }

        const normalizedGames = (gamesRes.data.games || []).map((game) => ({
          ...game,
          image_path: withImageProxy(game.image_path),
        }));

        setGames(normalizedGames);
        setRecentWins(winsRes.data.wins || []);

        const wallets = walletRes.data.wallets || [];
        setWalletBalance(pickPreferredWalletBalance(wallets));

        const sessionUser = getStoredSession()?.user;
        setProfile({
          username: meRes.data.user.username || sessionUser?.username || "User",
          email: meRes.data.user.email || sessionUser?.email || "",
          avatarUrl: meRes.data.user.avatarUrl || sessionUser?.avatarUrl || null,
        });
      } catch {
        if (!mounted) {
          return;
        }
        setGames([]);
        setRecentWins([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      void refreshWalletBalance();
    };

    window.addEventListener("krabets:wallet-refresh", handler);
    return () => {
      window.removeEventListener("krabets:wallet-refresh", handler);
    };
  }, [refreshWalletBalance]);

  const categories = useMemo(() => games.slice(0, 6), [games]);
  const originals = useMemo(() => games.slice(0, 7), [games]);

  return {
    loading,
    games,
    categories,
    originals,
    recentWins,
    walletBalance,
    profile,
  };
}
