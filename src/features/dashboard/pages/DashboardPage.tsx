"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./DashboardPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import type { DashboardGame } from "@/features/dashboard/types/dashboard.types";
import { getDashboardGameHref } from "@/features/dashboard/utils/gameNavigation";

export function DashboardPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const gameCarouselRef = useRef<HTMLDivElement | null>(null);
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();

  const sliderGames: DashboardGame[] = [
    {
      id: "dash-crash",
      code: "crash",
      name: "Crash",
      status: true,
      tag: "Original",
      image: "/crash2.png",
    },
    {
      id: "dash-limbo",
      code: "limbo",
      name: "Limbo",
      status: true,
      tag: "Original",
      image: "/limbo2.png",
    },
    {
      id: "dash-mines",
      code: "mines",
      name: "Mines",
      status: true,
      tag: "Original",
      image: "/mines2.png",
    },
    {
      id: "dash-dice",
      code: "dice",
      name: "Dice",
      status: true,
      tag: "Original",
      image: "/bigdice2.png",
    },
    {
      id: "dash-coinflip",
      code: "coinflip",
      name: "Plinko",
      status: true,
      tag: "Original",
      image: "/coinflip2.png",
    },
  ];

  const carouselGames: DashboardGame[] = [
    {
      id: "dash-carousel-limbo",
      code: "limbo",
      name: "Limbo",
      status: true,
      tag: "Original",
      image: "/limbo.png",
    },
    {
      id: "dash-carousel-dice",
      code: "dice",
      name: "Big Dice",
      status: true,
      tag: "Original",
      image: "/bigdice.png",
    },
    {
      id: "dash-carousel-mines",
      code: "mines",
      name: "Mines",
      status: true,
      tag: "Original",
      image: "/mines.png",
    },
    {
      id: "dash-carousel-coinflip",
      code: "coinflip",
      name: "Coin Flip",
      status: true,
      tag: "Original",
      image: "/coinflip.png",
    },
    {
      id: "dash-carousel-crash",
      code: "crash",
      name: "Crash",
      status: true,
      tag: "Original",
      image: "/crash.png",
    },
  ];

  const sliderCards = useMemo(
    () =>
      sliderGames.map((game, index) => ({
        id: `${game.name}-${index}`,
        title: game.name,
        subtitle: `${game.tag} Spotlight`,
        image: game.image,
        href: getDashboardGameHref(game),
      })),
    [sliderGames]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sliderCards.length);
    }, 3400);
    return () => window.clearInterval(timer);
  }, [sliderCards.length]);

  const scrollGameRow = (direction: "left" | "right") => {
    const node = gameCarouselRef.current;
    if (!node) {
      return;
    }
    const step = Math.max(220, Math.floor(node.clientWidth * 0.72));
    node.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  const categoryTiles = [
    { title: "Casino", count: "1335 Games", icon: "fa-solid fa-dice" },
    { title: "Sports", count: "1124 Matches", icon: "fa-solid fa-futbol" },
    { title: "Live Casino", count: "382 Tables", icon: "fa-solid fa-tower-broadcast" },
    { title: "Lottery", count: "1881 Draws", icon: "fa-solid fa-ticket" },
    { title: "Racing", count: "2364 Events", icon: "fa-solid fa-flag-checkered" },
    { title: "Poker", count: "1779 Rooms", icon: "fa-solid fa-chess" },
  ];

  const liveChatMessages = [
    {
      user: "AceNova",
      avatar: "https://i.pravatar.cc/40?img=12",
      message: "Anybody else cooking on Limbo tonight or is Crash the move?",
    },
    {
      user: "LunaBet",
      avatar: "https://i.pravatar.cc/40?img=5",
      message: "Big Dice just went crazy, that roll was actually insane.",
    },
    {
      user: "SpinGhost",
      avatar: "https://i.pravatar.cc/40?img=22",
      message: "Yo the new lobby looks clean, who is running Mines right now?",
    },
    {
      user: "KingParlay",
      avatar: "https://i.pravatar.cc/40?img=33",
      message: "Sports slip almost landed, one more goal would have changed everything.",
    },
    {
      user: "NeonChip",
      avatar: "https://i.pravatar.cc/40?img=41",
      message: "Public chat is active tonight, drop your best hit before reset.",
    },
  ];

  const statCards = [
    { label: "Live Players", value: "24,860", icon: "fa-solid fa-users" },
    { label: "Today Volume", value: "$1.8M", icon: "fa-solid fa-chart-line" },
    { label: "Payout Ratio", value: "98.4%", icon: "fa-solid fa-percent" },
    { label: "Active Games", value: "412", icon: "fa-solid fa-gamepad" },
  ];

  if (isChecking) {
    return <div className="dashboard-auth-loading" aria-hidden="true"></div>;
  }

  if (!isAuthenticated) {
    return null;
  }

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

          <div className="krabet-content dfr-root">
            <section className="dfr-hero">
              <div className="dash-card dash-hero-card">
                <div className="dash-hero-content">
                  <span className="dash-pill-tag">WELCOME BONUS</span>
                  <h2 className="dash-hero-title">GET UP TO 100% BONUS ON YOUR FIRST DEPOSIT</h2>
                  <a href="/dashboard/wallet" className="dash-primary-btn">
                    DEPOSIT NOW
                  </a>
                </div>
                <img src="/tiger-hero.png" alt="Promo character" className="dash-hero-character" />
              </div>
            </section>

            <div className="dfr-top-duo">
              <section className="dfr-surface dfr-surface-carousel">
                <div className="dfr-head">
                  <h2>Game Carousel</h2>
                  <a href="#">Open Lobby</a>
                </div>
                <div className="dfr-slider-wrap">
                  <div className="dfr-slider-viewport">
                    <div className="dfr-slider-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
                      {sliderCards.map((slide) => (
                        <a href={slide.href} className="dfr-slider-slide" key={slide.id}>
                          <img src={slide.image} alt={slide.title} className="dfr-slider-image" />
                          <div className="dfr-slider-overlay" />
                          <div className="dfr-slider-text">
                            <h4>{slide.title}</h4>
                            <p>{slide.subtitle}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="dfr-slider-dots" aria-label="Slider dots">
                    {sliderCards.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        className={`dfr-dot ${index === activeSlide ? "is-active" : ""}`}
                        onClick={() => setActiveSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="dfr-game-row">
                  <h2 className="carousel-head">Popular Games</h2>

                  <button
                    type="button"
                    className="dfr-game-nav dfr-game-nav-left"
                    aria-label="Scroll games left"
                    onClick={() => scrollGameRow("left")}
                  >
                    <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
                  </button>

                  <button
                    type="button"
                    className="dfr-game-nav dfr-game-nav-right"
                    aria-label="Scroll games right"
                    onClick={() => scrollGameRow("right")}
                  >
                    <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
                  </button>

                  <div className="dfr-game-carousel" ref={gameCarouselRef}>
                    {carouselGames.map((game, index) => (
                      <a href={getDashboardGameHref(game)} className="dfr-game-card" key={`${game.name}-${index}`}>
                        <img src={game.image} alt={game.name} />
                        <div className="dfr-game-overlay">
                          <span>{game.tag}</span>
                          <strong>{game.name}</strong>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </section>

              <section className="dfr-surface">
                <div className="dfr-head">
                  <h2>Category Tiles</h2>
                  <a href="#">All</a>
                </div>
                <div className="dfr-category-grid">
                  {categoryTiles.map((item) => (
                    <a href="#" className="dfr-category-card" key={item.title}>
                      <i className={item.icon} aria-hidden="true"></i>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.count}</small>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            </div>

            <div className="dfr-bottom-grid">
              <section className="dfr-surface">
                <div className="dfr-head">
                  <h2>Public Chat</h2>
                  <a href="#">View All</a>
                </div>

                <div className="dfr-chat-list">
                  {liveChatMessages.map((row) => (
                    <div className="dfr-chat-row" key={`${row.user}-${row.message}`}>
                      <div className="dfr-chat-user">
                        <span className="dfr-chat-avatar">
                          <img src={row.avatar} alt={row.user} />
                        </span>

                        <div className="dfr-chat-copy">
                          <strong>{row.user}</strong>
                          <p title={row.message}>{row.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <a href="/livechat" className="dfr-chat-cta">
                  <i className="fa-solid fa-comments" aria-hidden="true"></i>
                  <span>Join Chat</span>
                </a>
              </section>

              <section className="dfr-surface">
                <div className="dfr-head">
                  <h2>Live Stats</h2>
                  <a href="#">Today</a>
                </div>
                <div className="dfr-stats-grid">
                  {statCards.map((item) => (
                    <article className="dfr-stat-card" key={item.label}>
                      <span>
                        <i className={item.icon} aria-hidden="true"></i>
                        {item.label}
                      </span>
                      <strong>{item.value}</strong>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
