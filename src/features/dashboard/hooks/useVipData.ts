"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchVipLevels, fetchVipMe } from "@/features/dashboard/api/vip.api";
import { getAccessTokenFromStorage } from "@/shared/utils/session";

type VipSnapshot = {
  levelName: string;
  totalWager: string;
  nextLevelName: string | null;
  nextLevelRequiredWager: string | null;
  progressPercent: number;
  totalWagerRaw: string;
  totalDeposits: string;
  totalSessions: number;
  isVerified: boolean;
  daysActive: number;
  gameContributions: Record<string, number>;
};

type VipLevelCard = {
  id: string;
  name: string;
  requiredWager: string;
  rakebackPercent: string;
  cashbackPercent: string;
  bonusMultiplier: string;
};

function normalizePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

export function useVipData() {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<VipSnapshot>({
    levelName: "Gold",
    totalWager: "0",
    nextLevelName: "Platinum",
    nextLevelRequiredWager: null,
    progressPercent: 55,
    totalWagerRaw: "0",
    totalDeposits: "0",
    totalSessions: 0,
    daysActive: 0,
    isVerified: false,
    gameContributions: {},
  });
  const [levels, setLevels] = useState<VipLevelCard[]>([]);

  const loadVipData = useCallback(async () => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [profileRes, levelsRes] = await Promise.all([fetchVipMe(token), fetchVipLevels()]);
      const profile = profileRes.data.profile;
      setSnapshot({
        levelName: profile.level_name,
        totalWager: profile.total_wager,
        nextLevelName: profile.next_level_name,
        nextLevelRequiredWager: profile.next_level_required_wager,
        progressPercent: normalizePercent(profile.progress_percent),
        totalWagerRaw: profile.total_wager_raw,
        totalDeposits: profile.total_deposits,
        totalSessions: profile.total_sessions,
        daysActive: profile.days_active || 0,
        isVerified: profile.is_verified,
        gameContributions: profile.game_contributions || {},
      });

      setLevels(
        (levelsRes.data.levels || []).map((level) => ({
          id: level.id,
          name: level.name,
          requiredWager: level.required_wager,
          rakebackPercent: level.rakeback_percent,
          cashbackPercent: level.cashback_percent,
          bonusMultiplier: level.bonus_multiplier,
        })),
      );
    } catch {
      setLevels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVipData();
  }, [loadVipData]);

  useEffect(() => {
    const handler = () => {
      void loadVipData();
    };
    window.addEventListener("krabets:vip-refresh", handler);
    window.addEventListener("krabets:wallet-refresh", handler);
    return () => {
      window.removeEventListener("krabets:vip-refresh", handler);
      window.removeEventListener("krabets:wallet-refresh", handler);
    };
  }, [loadVipData]);

  const normalizedLevelName = useMemo(() => snapshot.levelName.trim().toLowerCase(), [snapshot.levelName]);

  return {
    loading,
    snapshot,
    levels,
    normalizedLevelName,
    reload: loadVipData,
  };
}
