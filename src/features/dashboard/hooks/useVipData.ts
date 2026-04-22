"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchVipLevels, fetchVipMe } from "@/features/dashboard/api/vip.api";
import { getAccessTokenFromStorage } from "@/shared/utils/session";

type VipSnapshot = {
  levelName: string;
  totalWager: string;
  nextLevelName: string | null;
  nextLevelRequiredWager: string | null;
  progressPercent: number;
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
  });
  const [levels, setLevels] = useState<VipLevelCard[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadVipData() {
      const token = getAccessTokenFromStorage();
      if (!token) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const [profileRes, levelsRes] = await Promise.all([fetchVipMe(token), fetchVipLevels()]);

        if (!mounted) {
          return;
        }

        const profile = profileRes.data.profile;
        setSnapshot({
          levelName: profile.level_name,
          totalWager: profile.total_wager,
          nextLevelName: profile.next_level_name,
          nextLevelRequiredWager: profile.next_level_required_wager,
          progressPercent: normalizePercent(profile.progress_percent),
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
        if (!mounted) {
          return;
        }

        setLevels([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadVipData();

    return () => {
      mounted = false;
    };
  }, []);

  const normalizedLevelName = useMemo(() => snapshot.levelName.trim().toLowerCase(), [snapshot.levelName]);

  return {
    loading,
    snapshot,
    levels,
    normalizedLevelName,
  };
}
