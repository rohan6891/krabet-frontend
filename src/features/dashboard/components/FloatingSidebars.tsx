"use client";

import { useState } from "react";
import "./FloatingSidebars.css";

interface Game {
  id: number | string;
  title: string;
  image: string;
  href: string;
}

interface FloatingSidebarsProps {
  games?: Game[];
}

export function FloatingSidebars({ games = [] }: FloatingSidebarsProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const leftNavItems = [
    { id: "home", label: "Home", iconClass: "fa-solid fa-house", href: "/" },
    { id: "search", label: "Search", iconClass: "fa-solid fa-magnifying-glass", href: "/search" },
    { id: "settings", label: "Settings", iconClass: "fa-solid fa-gear", href: "/settings" },
    { id: "notifications", label: "Alerts", iconClass: "fa-solid fa-bell", href: "/notifications" },
    { id: "wallet", label: "Wallet", iconClass: "fa-solid fa-wallet", href: "/wallet" },
    { id: "bonuses", label: "Bonuses", iconClass: "fa-solid fa-gift", href: "/bonuses" },
    { id: "history", label: "History", iconClass: "fa-solid fa-clock-rotate-left", href: "/history" },
  ];

  return (
    <>
      {/* MOBILE HAMBURGER TOGGLE */}
      <button className="mobile-hamburger-btn" onClick={() => setIsMobileOpen(true)} aria-label="Open menu">
        <i className="fa-solid fa-bars"></i>
      </button>

      {/* MOBILE OVERLAY / BACKDROP */}
      {isMobileOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>
      )}

      {/* MAIN SIDEBAR (Desktop Hover & Mobile Drawer) */}
      <aside className={`floating-sidebar left-sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
        {/* MOBILE CLOSE BTN */}
        <button className="mobile-close-btn" onClick={() => setIsMobileOpen(false)} aria-label="Close menu">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* HOVER TRIGGER ARROW (Desktop Only) */}
        <div className="desktop-hover-trigger">
          <i className="fa-solid fa-chevron-right"></i>
        </div>

        <div className="sidebar-top-group">
          {leftNavItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="sidebar-nav-item"
              aria-label={item.label}
              title={item.label}
            >
              <span className="sidebar-icon-box">
                <i className={item.iconClass} aria-hidden="true"></i>
              </span>
              <span className="sidebar-label">{item.label}</span>
            </a>
          ))}
        </div>
      </aside>
    </>
  );
}
