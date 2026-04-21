"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { GameImageWithSkeleton } from "@/features/dashboard/components/GameImageWithSkeleton";
import { getDashboardGameHref } from "@/features/dashboard/utils/gameNavigation";
import { fetchDashboardGamesByCategory } from "@/features/dashboard/api/dashboard.api";
import type { DashboardGame } from "@/features/dashboard/types/dashboard.types";
import "@/features/dashboard/pages/DashboardPage.css";
import "@/features/search/pages/SearchPage.css";
import "@/app/dashboard/categories/coming-soon/[category]/ComingSoonPage.css";

type CategoryKey = "casino" | "sports" | "live" | "lottery" | "racing" | "poker";

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  casino: "Casino",
  sports: "Sports",
  live: "Live Casino",
  lottery: "Lottery",
  racing: "Racing",
  poker: "Poker"
};

export function CategoryGamesPage({ category }: { category: string }) {
  const normalized = (category || "").toLowerCase() as CategoryKey;
  const safeCategory: CategoryKey = ["casino", "sports", "live", "lottery", "racing", "poker"].includes(normalized)
    ? normalized
    : "casino";

  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();

  const [games, setGames] = useState<DashboardGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCategoryGames() {
      setLoading(true);
      try {
        const response = await fetchDashboardGamesByCategory(safeCategory);
        if (!mounted) {
          return;
        }
        setGames(response.data.games || []);
      } catch {
        if (!mounted) {
          return;
        }
        setGames([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCategoryGames();

    return () => {
      mounted = false;
    };
  }, [safeCategory]);

  const heading = CATEGORY_LABEL[safeCategory];
  const countLine = useMemo(
    () => `${games.length} ${heading.toLowerCase()} game${games.length === 1 ? "" : "s"}`,
    [games.length, heading],
  );

  if (isChecking) return <div className="dashboard-auth-loading" aria-hidden="true" />;
  if (!isAuthenticated) return null;

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
            <main className="search-page">
              <section className="search-hero-card">
                <div className="search-heading-wrap">
                  <h1 className="search-page-title">{heading} Games</h1>
                  <p className="search-page-subtitle">{countLine}</p>
                </div>
              </section>

              <section className="search-results-card">
                <div className="section-title-row">
                  <div className="section-title-left">
                    <div className="section-icon-badge">
                      <i className="fa-solid fa-gamepad" />
                    </div>
                    <div>
                      <h2>{heading} Collection</h2>
                      <p>Pick your table and jump in.</p>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="games-grid compact-grid">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <article className="game-card compact-card skeleton-card" key={`cat-sk-${idx}`}>
                        <div className="game-thumb-wrap compact-thumb-wrap skeleton-block" style={{ height: "140px" }} />
                        <div className="compact-card-body">
                          <div className="skeleton-block" style={{ height: "16px", width: "70%", marginBottom: "10px" }} />
                          <div className="skeleton-block" style={{ height: "30px", width: "100%", borderRadius: "12px" }} />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : games.length > 0 ? (
                  <div className="games-grid compact-grid">
                    {games.map((game) => (
                      <article className="game-card compact-card" key={game.id}>
                        <div className="game-thumb-wrap compact-thumb-wrap">
                          <GameImageWithSkeleton src={game.image_path || ""} alt={game.name} className="game-thumb" />
                          <span className="game-category-badge">{heading}</span>
                        </div>

                        <div className="game-card-body compact-card-body">
                          <h3 className="game-title">{game.name}</h3>

                          <div className="game-meta-row">
                            <div className="players-info">
                              <i className="fa-solid fa-star" style={{ color: "#ca8bff" }} />
                              <span>{game.subtitle || "Popular"}</span>
                            </div>

                            <Link href={getDashboardGameHref(game)} className="play-now-btn compact-play-btn">
                              <i className="fa-solid fa-play" />
                              <span>Play</span>
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <section className="coming-funky-shell" style={{ marginTop: '0' }}>
                    <div className="coming-spark" aria-hidden="true"></div>
                    <div className="coming-main-card">
                      <p className="coming-pill">Launching Soon</p>
                      <h1>{heading} Arena Is Almost Here</h1>
                      <p>
                        We are polishing this zone with fresh odds, new lobbies and wild weekly rewards.
                      </p>

                      <div className="coming-cta-row">
                        <Link href="/dashboard/wallet" className="coming-btn-primary">
                          Deposit Now
                        </Link>
                        <Link href="/dashboard/categories/casino" className="coming-btn-ghost">
                          Play Casino
                        </Link>
                      </div>
                    </div>

                    <div className="coming-image-strip">
                      <article className="coming-image-card">
                        <img src="/crash2.png" alt="Crash game preview" />
                      </article>
                      <article className="coming-image-card">
                        <img src="/mines2.png" alt="Mines game preview" />
                      </article>
                      <article className="coming-image-card">
                        <img src="/limbo2.png" alt="Limbo game preview" />
                      </article>
                    </div>
                  </section>
                )}
              </section>
            </main>
          </div>

          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
