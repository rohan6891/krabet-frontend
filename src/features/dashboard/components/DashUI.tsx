import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "./DashUI.css";

import { useSession } from "@/shared/hooks/useSession";
import { useWallet } from "@/shared/hooks/useWallet";

export function DashUI() {
  const { user } = useSession();
  const { totalBalance, transactions } = useWallet();
  
  const wagered = transactions
    .filter((t) => t.type === 'bet')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
    .toFixed(2);

  /* ---------------------------
     CAROUSEL SLIDES
  --------------------------- */
  const slides = useMemo(
    () => [
      {
        id: 1,
        title: "Uncharted 4",
        subtitle: "Premium bonus mode unlocked",
        image: "/car1.jpg",
        href: "/promotions/uncharted-bonus",
      },
      {
        id: 2,
        title: "Dishonored",
        subtitle: "High return feature spotlight",
        image: "/car2.jpg",
        href: "/promotions/dishonored-special",
      },
      {
        id: 3,
        title: "Neon Rush",
        subtitle: "Limited-time boosted rewards",
        image: "/car3.jpg",
        href: "/promotions/neon-rush",
      },
      {
        id: 4,
        title: "Neon Rush",
        subtitle: "Limited-time boosted rewards",
        image: "/car4.jpg",
        href: "/promotions/neon-rush",
      },
      {
        id: 5,
        title: "Neon Rush",
        subtitle: "Limited-time boosted rewards",
        image: "/car5.jpg",
        href: "/promotions/neon-rush",
      },
    ],
    []
  );

  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-slide loop for carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 3200);

    return () => clearInterval(interval);
  }, [slides.length]);

  /* ---------------------------
     QUICK LINK BOXES
  --------------------------- */
  const quickBoxes = [
    { id: 1, label: "POKER", image: "/poker.png", href: "/poker" },
    { id: 2, label: "CASINO", image: "/casino.png", href: "/sports" },
    { id: 3, label: "LOTTERY", image: "/lotto.png", href: "/lottery" },
    { id: 4, label: "SLOTS", image: "/slots.png", href: "/slots" },
  ];

  return (
    <section className="dash-ui-shell">
      <div className={`dash-ui-grid ${!user ? "no-user" : ""}`}>
        {/* =========================
            MODULE 1 : TOP LEFT HERO
           ========================= */}
        <div className="dash-card dash-hero-card">
          <div className="dash-hero-content">
            <span className="dash-pill-tag">WELCOME BONUS</span>
            <h2 className="dash-hero-title">
              GET UP TO 100% BONUS ON YOUR FIRST DEPOSIT
            </h2>
            
            <div className="dash-hero-features">
              <span className="hero-feature"><i className="fa-solid fa-bolt"></i> Instant Payouts</span>
              <span className="hero-feature"><i className="fa-solid fa-shield-halved"></i> Provably Fair</span>
              <span className="hero-feature"><i className="fa-solid fa-headset"></i> 24/7 Support</span>
            </div>

            <Link href="/deposit" className="dash-primary-btn">
              DEPOSIT NOW
            </Link>
          </div>
          <img
            src="/herotop.png"
            alt="Promo character"
            className="dash-hero-character"
          />
        </div>

        {/* MODULE 2 (Live Chat) REMOVED */}

        {/* =========================
            MODULE 3 : MIDDLE LEFT CAROUSEL
           ========================= */}
        <div className="dash-card dash-carousel-card">
          <div className="dash-section-head">
            <h3><span className="icons">●</span> Featured Games</h3>
            <div className="dash-carousel-dots" aria-label="Carousel navigation">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`dash-dot ${index === activeSlide ? "is-active" : ""}`}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="dash-carousel-viewport">
            <div
              className="dash-carousel-track"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {slides.map((slide) => (
                <Link
                  key={slide.id}
                  href={slide.href}
                  className="dash-carousel-slide"
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="dash-carousel-image"
                  />
                  <div className="dash-carousel-overlay"></div>
                  <div className="dash-carousel-text">
                    <h4>{slide.title}</h4>
                    <p>{slide.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* =========================
            MODULE 4 : BOTTOM RIGHT QUICK BOX CLUSTER
           ========================= */}
        <div className="dash-card dash-quick-card">
          <div className="dash-section-head">
            <h3><span className="icons">●</span> Top picks</h3>
          </div>
          <div className="dash-quick-grid">
            {quickBoxes.map((item) => (
              <Link key={item.id} href={item.href} className="dash-quick-box">
                <img
                  src={item.image}
                  alt={item.label}
                  className="dash-quick-img"
                />
                <span className="dash-quick-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* =========================
            MODULE 5 : BOTTOM LEFT USER INFO
           ========================= */}
        {user && (
          <div className="dash-card dash-user-card">
            <div className="dash-section-head">
              <h3>User Info</h3>
            </div>
            <div className="dash-user-balance">
              <span className="dash-user-balance-label">Balance</span>
              <strong>${totalBalance}</strong>
            </div>
            <div className="dash-user-stats">
              <div className="dash-user-stat">
                <span className="dash-user-stat-label">VIP Level</span>
                <strong>Bronze</strong>
              </div>
              <div className="dash-user-stat">
                <span className="dash-user-stat-label">Bonuses</span>
                <strong>0 Active</strong>
              </div>
              <div className="dash-user-stat">
                <span className="dash-user-stat-label">Wagered</span>
                <strong>${wagered}</strong>
              </div>
              <div className="dash-user-stat">
                <span className="dash-user-stat-label">Transactions</span>
                <strong>{transactions.length}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
