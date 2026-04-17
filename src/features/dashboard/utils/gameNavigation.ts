import type { DashboardGame } from "@/features/dashboard/types/dashboard.types";

function normalizeCode(value?: string): string {
  return (value || "").trim().toLowerCase();
}

export function getDashboardGameHref(game: DashboardGame): string {
  const code = normalizeCode(game.code);

  if (code === "mines") {
    return "/dashboard/mines";
  }

  if (code === "limbo") {
    return "/dashboard/limbo";
  }

  if (code === "coinflip") {
    return "/dashboard/coinflip";
  }

  return `/dashboard/search?game=${encodeURIComponent(code || game.name || "")}`;
}
