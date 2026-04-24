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

  if (code === "crash") {
    return "/dashboard/crash";
  }

  if (code === "dice") {
    return "/dashboard/dice";
  }

  if (code === "plinko") {
    return "/dashboard/categories/coming-soon/plinko";
  }

  return `/dashboard/search?game=${encodeURIComponent(code || game.name || "")}`;
}
