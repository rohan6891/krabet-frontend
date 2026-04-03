import type { DashboardGame } from "@/features/dashboard/types/dashboard.types";

function normalizeCode(value?: string): string {
  return (value || "").trim().toLowerCase();
}

export function getDashboardGameHref(game: DashboardGame): string {
  const code = normalizeCode(game.code);

  if (code === "mines") {
    return "/dashboard/mines";
  }

  return `/dashboard/search?game=${encodeURIComponent(code || game.name || "")}`;
}
