"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { GameImageWithSkeleton } from "@/features/dashboard/components/GameImageWithSkeleton";
import { getDashboardGameHref } from "@/features/dashboard/utils/gameNavigation";
import type { DashboardGame } from "@/features/dashboard/types/dashboard.types";
import "@/features/dashboard/pages/DashboardPage.css";
import "@/app/dashboard/categories/coming-soon/[category]/ComingSoonPage.css";
import "./SearchPage.css";

type SearchCategoryKey = "casino" | "sports" | "live-casino" | "lottery" | "racing" | "poker";

const SEARCH_CATEGORIES: Array<{ key: SearchCategoryKey; label: string }> = [
  { key: "casino", label: "Casino" },
  { key: "sports", label: "Sports" },
  { key: "live-casino", label: "Live Casino" },
  { key: "lottery", label: "Lottery" },
  { key: "racing", label: "Racing" },
  { key: "poker", label: "Poker" },
];

function normalizeCategory(value?: string | null): SearchCategoryKey | null {
  const raw = (value || "").trim().toLowerCase();
  if (!raw) return null;
  if (["sports", "sport"].includes(raw)) return "sports";
  if (["live", "live-casino", "live casino", "livecasino", "live_casino"].includes(raw)) return "live-casino";
  if (["lottery", "lotto"].includes(raw)) return "lottery";
  if (["racing", "race"].includes(raw)) return "racing";
  if (["poker"].includes(raw)) return "poker";
  return "casino";
}

function getGameCategory(game: DashboardGame): SearchCategoryKey {
  const directCategory = typeof game.category === "string" ? game.category : null;
  const configCategory =
    game.config && typeof game.config === "object" && typeof (game.config as any).category === "string"
      ? (game.config as any).category
      : null;
  return normalizeCategory(directCategory || configCategory) || "casino";
}

export function SearchPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile, games, loading: gamesLoading } = useDashboardData();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterWrapRef = useRef<HTMLDivElement | null>(null);

  const selectedCategory = normalizeCategory(searchParams.get("category"));
  const selectedCategoryLabel =
    SEARCH_CATEGORIES.find((category) => category.key === selectedCategory)?.label || null;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!filterWrapRef.current) return;
      if (!filterWrapRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const applyCategoryFilter = (nextCategory: SearchCategoryKey | null) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (!nextCategory) {
      nextParams.delete("category");
    } else if (nextCategory === selectedCategory) {
      nextParams.delete("category"); // Toggle off if clicked again
    } else {
      nextParams.set("category", nextCategory);
    }
    const target = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    router.push(target);
  };

  const filteredGames = useMemo(() => {
    if (!games) return [];
    const trimmed = searchTerm.trim().toLowerCase();
    
    return games.filter((game) => {
      const gameCategory = getGameCategory(game);
      const categoryMatch = !selectedCategory || gameCategory === selectedCategory;
      if (!categoryMatch) return false;

      if (!trimmed) return true;
      return game.name.toLowerCase().includes(trimmed);
    });
  }, [searchTerm, games, selectedCategory]);

  if (isChecking) return <div className="dashboard-auth-loading" aria-hidden="true" />;
  if (!isAuthenticated) return null;

  const showingSearchResults = searchTerm.trim().length > 0;
  const sectionTitle = showingSearchResults
    ? "Search Results"
    : selectedCategoryLabel
      ? `${selectedCategoryLabel} Games`
      : "All Games";
  const sectionSubtitle = showingSearchResults
    ? `${filteredGames.length} result${filteredGames.length !== 1 ? "s" : ""} found`
    : selectedCategoryLabel
      ? `Showing ${selectedCategoryLabel.toLowerCase()} games`
      : "Explore our complete game collection";

  const showComingSoon = !gamesLoading && filteredGames.length === 0 && selectedCategory && selectedCategory !== "casino";

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

                  <div className={`search-filter-wrap${isFilterOpen ? " is-open" : ""}`} ref={filterWrapRef}>
                    <button
                      type="button"
                      className="search-filter-btn"
                      onClick={() => setIsFilterOpen((prev) => !prev)}
                      aria-expanded={isFilterOpen}
                      aria-haspopup="menu"
                    >
                      <i className="fa-solid fa-sliders" />
                      <span>{selectedCategoryLabel || "Filter"}</span>
                      <i className={`fa-solid fa-chevron-${isFilterOpen ? "up" : "down"} search-filter-chevron`} />
                    </button>

                    {isFilterOpen && (
                      <div className="search-filter-dropdown" role="menu" aria-label="Game categories">
                        <button
                          type="button"
                          role="menuitem"
                          className={`search-filter-option${!selectedCategory ? " is-active" : ""}`}
                          onClick={() => {
                            applyCategoryFilter(null);
                            setIsFilterOpen(false);
                          }}
                        >
                          <span>All Categories</span>
                          {!selectedCategory && <i className="fa-solid fa-check" aria-hidden="true" />}
                        </button>
                        {SEARCH_CATEGORIES.map((category) => (
                          <button
                            key={category.key}
                            type="button"
                            role="menuitem"
                            className={`search-filter-option${selectedCategory === category.key ? " is-active" : ""}`}
                            onClick={() => {
                              applyCategoryFilter(category.key);
                              setIsFilterOpen(false);
                            }}
                          >
                            <span>{category.label}</span>
                            {selectedCategory === category.key && <i className="fa-solid fa-check" aria-hidden="true" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {gamesLoading && (
                  <div className="search-status loading-status">
                    <i className="fa-solid fa-spinner fa-spin" />
                    <span>Loading games...</span>
                  </div>
                )}
              </section>

              {showComingSoon ? (
                <section className="coming-funky-shell" style={{ marginTop: '24px' }}>
                  <div className="coming-spark" aria-hidden="true"></div>
                  <div className="coming-main-card">
                    <p className="coming-pill">Launching Soon</p>
                    <h1>{selectedCategoryLabel} Arena Is Almost Here</h1>
                    <p>
                      We are polishing this zone with fresh odds, new lobbies and wild weekly rewards.
                    </p>

                    <div className="coming-cta-row">
                      <Link href="/dashboard/wallet" className="coming-btn-primary">
                        Deposit Now
                      </Link>
                      <button onClick={() => applyCategoryFilter("casino")} className="coming-btn-ghost" style={{ cursor: "pointer" }}>
                        Play Casino
                      </button>
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
              ) : (
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
                              {SEARCH_CATEGORIES.find(c => c.key === getGameCategory(game))?.label || "Casino Game"}
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
              )}
            </main>
          </div>

          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
