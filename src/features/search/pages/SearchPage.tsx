"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { GameImageWithSkeleton } from "@/features/dashboard/components/GameImageWithSkeleton";
import { getDashboardGameHref } from "@/features/dashboard/utils/gameNavigation";
import "@/features/dashboard/pages/DashboardPage.css";
import "./SearchPage.css";

export function SearchPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile, games, loading: gamesLoading } = useDashboardData();

  const [searchTerm, setSearchTerm] = useState("");

  const filteredGames = useMemo(() => {
    if (!games) return [];
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return games;

    return games.filter((game) => {
      const titleMatch = game.name.toLowerCase().includes(trimmed);
      return titleMatch;
    });
  }, [searchTerm, games]);

  if (isChecking) return <div className="dashboard-auth-loading" aria-hidden="true" />;
  if (!isAuthenticated) return null;

  const showingSearchResults = searchTerm.trim().length > 0;
  const sectionTitle = showingSearchResults ? "Search Results" : "All Games";
  const sectionSubtitle = showingSearchResults
    ? `${filteredGames.length} result${filteredGames.length !== 1 ? "s" : ""} found`
    : "Explore our complete game collection";

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
                  <h1 className="search-page-title">Search</h1>
                  <p className="search-page-subtitle">
                    Find your favorite games instantly and explore fresh titles
                    with the same sleek casino experience.
                  </p>
                </div>

                <div className="search-input-wrap">
                  <i className="fa-solid fa-magnifying-glass search-input-icon" />

                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search games, providers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <button type="button" className="search-filter-btn">
                    <i className="fa-solid fa-sliders" />
                    <span>Filter</span>
                  </button>
                </div>

                {gamesLoading && (
                  <div className="search-status loading-status">
                    <i className="fa-solid fa-spinner fa-spin" />
                    <span>Loading games...</span>
                  </div>
                )}
              </section>

              <section className="search-results-card">
                <div className="section-title-row">
                  <div className="section-title-left">
                    <div className="section-icon-badge">
                      <i className="fa-solid fa-gamepad" />
                    </div>
                    <div>
                      <h2>{sectionTitle}</h2>
                      <p>{sectionSubtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="games-grid compact-grid">
                  {gamesLoading ? (
                    // Skeleton loaders while fetching
                    Array.from({ length: 8 }).map((_, idx) => (
                      <article className="game-card compact-card skeleton-card" key={`sk-${idx}`}>
                        <div className="game-thumb-wrap compact-thumb-wrap skeleton-block" style={{ height: '140px' }} />
                        <div className="compact-card-body">
                          <div className="skeleton-block" style={{ height: '16px', width: '70%', marginBottom: '10px' }} />
                          <div className="skeleton-block" style={{ height: '30px', width: '100%', borderRadius: '12px' }} />
                        </div>
                      </article>
                    ))
                  ) : filteredGames.length > 0 ? (
                    filteredGames.map((game) => (
                      <article className="game-card compact-card" key={game.id}>
                        <div className="game-thumb-wrap compact-thumb-wrap">
                          <GameImageWithSkeleton
                            src={game.image_path || ""}
                            alt={game.name}
                            className="game-thumb"
                          />
                          <span className="game-category-badge">
                            Casino Game
                          </span>
                        </div>

                        <div className="game-card-body compact-card-body">
                          <h3 className="game-title">{game.name}</h3>

                          <div className="game-meta-row">
                            <div className="players-info">
                              <i className="fa-solid fa-star" style={{ color: '#ca8bff' }} />
                              <span>Popular</span>
                            </div>

                            <Link
                              href={getDashboardGameHref(game)}
                              className="play-now-btn compact-play-btn"
                            >
                              <i className="fa-solid fa-play" />
                              <span>Play</span>
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <i className="fa-solid fa-magnifying-glass" />
                      </div>
                      <h3>No games found</h3>
                      <p>Try searching with another keyword.</p>
                    </div>
                  )}
                </div>
              </section>
            </main>
          </div>

          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
