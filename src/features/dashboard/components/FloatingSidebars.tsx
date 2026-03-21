"use client";

import { useEffect, useRef, useState } from "react";
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
  const [isHoverPreview, setIsHoverPreview] = useState(false);

  const sidebarRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Opens while hovering the handle and stays open when pinned by click.
  const isDesktopOpen = isPinned || isHoverPreview;

  useEffect(() => {
    if (!isPinned || isMobileOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideSidebar = sidebarRef.current?.contains(target);
      const clickedTrigger = triggerRef.current?.contains(target);

      if (!clickedInsideSidebar && !clickedTrigger) {
        setIsPinned(false);
        setIsHoverPreview(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isPinned, isMobileOpen]);

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

      <button
        ref={triggerRef}
        type="button"
        className={`desktop-edge-trigger ${isDesktopOpen ? "open" : ""}`}
        onMouseEnter={() => setIsHoverPreview(true)}
        onMouseLeave={() => {
          if (!isPinned) {
            setIsHoverPreview(false);
          }
        }}
        onClick={() => {
          if (isDesktopOpen) {
            setIsPinned(false);
            setIsHoverPreview(false);
            return;
          }

          setIsPinned(true);
          setIsHoverPreview(true);
        }}
        aria-label={isDesktopOpen ? "Hide sidebar" : "Show sidebar"}
        aria-expanded={isDesktopOpen}
      >
        <i className={`fa-solid ${isDesktopOpen ? "fa-chevron-left" : "fa-chevron-right"}`}></i>
      </button>

      {/* Sidebar wrapper with hover support for peek-open behavior */}
      <aside
        ref={sidebarRef}
        className={`floating-sidebar left-sidebar ${isMobileOpen ? "mobile-open" : ""} ${isDesktopOpen ? "desktop-open" : ""}`}
        onMouseEnter={() => setIsHoverPreview(true)}
        onMouseLeave={() => {
          if (!isPinned) {
            setIsHoverPreview(false);
          }
        }}
      >
        <button className="mobile-close-btn" onClick={() => setIsMobileOpen(false)} aria-label="Close menu">
          <i className="fa-solid fa-xmark"></i>
        </button>

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
