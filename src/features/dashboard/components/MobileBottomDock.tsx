"use client";

import { useMemo, useState } from "react";
import { sidebarBottomLinks, sidebarTopLinks } from "@/features/dashboard/components/DashboardSidebar";
import "./MobileBottomDock.css";

type MobileBottomDockProps = {
  onAlertsClick?: () => void;
};

export function MobileBottomDock({ onAlertsClick }: MobileBottomDockProps) {
  const [dockExpanded, setDockExpanded] = useState(false);

  const mobileSidebarLinks = useMemo(() => {
    return [...sidebarTopLinks, ...sidebarBottomLinks];
  }, []);

  return (
    <div className="mbd2-shell">
      <div className={`mbd2-extra-panel ${dockExpanded ? "mbd2-extra-panel-open" : ""}`}>
        <div className="mbd2-sidebar-list">
          {mobileSidebarLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="mbd2-extra-link"
              aria-label={item.label}
              title={item.label}
              onClick={() => setDockExpanded(false)}
            >
              <span className="mbd2-extra-icon">
                <i className={item.icon} aria-hidden="true"></i>
              </span>
              <span className="mbd2-extra-text">{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      <nav className="mbd2-dock" aria-label="Mobile bottom dock">
        <a href="/dashboard" className="mbd2-link" aria-label="Home" title="Home">
          <span className="mbd2-icon-wrap">
            <i className="fa-solid fa-house" aria-hidden="true"></i>
          </span>
          <span className="mbd2-text">Home</span>
        </a>

        <a href="/dashboard/search" className="mbd2-link" aria-label="Search" title="Search">
          <span className="mbd2-icon-wrap">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          </span>
          <span className="mbd2-text">Search</span>
        </a>

        <button
          type="button"
          className={`mbd2-link mbd2-link-accent ${dockExpanded ? "mbd2-link-accent-open" : ""}`}
          aria-label={dockExpanded ? "Close more menu" : "Open more menu"}
          aria-expanded={dockExpanded}
          onClick={() => setDockExpanded((prev) => !prev)}
        >
          <span className="mbd2-icon-wrap mbd2-icon-wrap-accent">
            <i
              className={dockExpanded ? "fa-solid fa-xmark" : "fa-solid fa-ellipsis"}
              aria-hidden="true"
            ></i>
          </span>
          <span className="mbd2-text">{dockExpanded ? "Close" : "More"}</span>
        </button>

        <button
          type="button"
          className="mbd2-link"
          aria-label="Alerts"
          title="Alerts"
          onClick={() => {
            window.dispatchEvent(new Event("krabets:open-notifications"));
            if (onAlertsClick) onAlertsClick();
          }}
        >
          <span className="mbd2-icon-wrap">
            <i className="fa-solid fa-bell" aria-hidden="true"></i>
          </span>
          <span className="mbd2-text">Alerts</span>
        </button>

        <a href="/dashboard/settings" className="mbd2-link" aria-label="Settings" title="Settings">
          <span className="mbd2-icon-wrap">
            <i className="fa-solid fa-gear" aria-hidden="true"></i>
          </span>
          <span className="mbd2-text">Settings</span>
        </a>
      </nav>
    </div>
  );
}
