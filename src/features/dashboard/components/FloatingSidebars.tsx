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
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Deriving the desktop open state from either interaction
  const isDesktopOpen = isPinned || isHovered;

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
      <button className="mobile-hamburger-btn" onClick={() => setIsMobileOpen(true)} aria-label="Open menu">
        <i className="fa-solid fa-bars"></i>
      </button>

      {isMobileOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>
      )}

      {/* Sidebar Wrapper with Mouse Listeners */}
      <aside 
        className={`floating-sidebar left-sidebar ${isMobileOpen ? "mobile-open" : ""} ${isDesktopOpen ? "desktop-open" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button className="mobile-close-btn" onClick={() => setIsMobileOpen(false)} aria-label="Close menu">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Hover / Click Toggle Tab */}
        <div className="desktop-toggle-tab" onClick={() => setIsPinned(!isPinned)}>
          <i className={`fa-solid ${isPinned ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
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
