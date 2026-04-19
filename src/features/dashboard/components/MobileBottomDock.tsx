"use client";

import { useMemo, useState } from "react";
import { sidebarBottomLinks, sidebarTopLinks } from "@/features/dashboard/components/DashboardSidebar";
import { useI18n } from "@/shared/i18n/useI18n";
import "./MobileBottomDock.css";

type MobileBottomDockProps = {
  onAlertsClick?: () => void;
};

export function MobileBottomDock({ onAlertsClick }: MobileBottomDockProps) {
  const [dockExpanded, setDockExpanded] = useState(false);
  const { t } = useI18n();

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
              aria-label={t(item.key, item.label)}
              title={t(item.key, item.label)}
              onClick={() => setDockExpanded(false)}
            >
              <span className="mbd2-extra-icon">
                <i className={item.icon} aria-hidden="true"></i>
              </span>
              <span className="mbd2-extra-text">{t(item.key, item.label)}</span>
            </a>
          ))}
        </div>
      </div>

      <nav className="mbd2-dock" aria-label={t("aria.mobileBottomDock", "Mobile bottom dock")}>
        <a
          href="/dashboard"
          className="mbd2-link"
          aria-label={t("mobile.home", "Home")}
          title={t("mobile.home", "Home")}
        >
          <span className="mbd2-icon-wrap">
            <i className="fa-solid fa-house" aria-hidden="true"></i>
          </span>
          <span className="mbd2-text">{t("mobile.home", "Home")}</span>
        </a>

        <a
          href="/dashboard/search"
          className="mbd2-link"
          aria-label={t("nav.search", "Search")}
          title={t("nav.search", "Search")}
        >
          <span className="mbd2-icon-wrap">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          </span>
          <span className="mbd2-text">{t("nav.search", "Search")}</span>
        </a>

        <button
          type="button"
          className={`mbd2-link mbd2-link-accent ${dockExpanded ? "mbd2-link-accent-open" : ""}`}
          aria-label={
            dockExpanded
              ? t("aria.closeMoreMenu", "Close more menu")
              : t("aria.openMoreMenu", "Open more menu")
          }
          aria-expanded={dockExpanded}
          onClick={() => setDockExpanded((prev) => !prev)}
        >
          <span className="mbd2-icon-wrap mbd2-icon-wrap-accent">
            <i
              className={dockExpanded ? "fa-solid fa-xmark" : "fa-solid fa-ellipsis"}
              aria-hidden="true"
            ></i>
          </span>
          <span className="mbd2-text">
            {dockExpanded ? t("mobile.close", "Close") : t("mobile.more", "More")}
          </span>
        </button>

        <button
          type="button"
          className="mbd2-link"
          aria-label={t("mobile.alerts", "Alerts")}
          title={t("mobile.alerts", "Alerts")}
          onClick={() => {
            window.dispatchEvent(new Event("krabets:open-notifications"));
            if (onAlertsClick) onAlertsClick();
          }}
        >
          <span className="mbd2-icon-wrap">
            <i className="fa-solid fa-bell" aria-hidden="true"></i>
          </span>
          <span className="mbd2-text">{t("mobile.alerts", "Alerts")}</span>
        </button>

        <a
          href="/dashboard/settings"
          className="mbd2-link"
          aria-label={t("mobile.settings", "Settings")}
          title={t("mobile.settings", "Settings")}
        >
          <span className="mbd2-icon-wrap">
            <i className="fa-solid fa-gear" aria-hidden="true"></i>
          </span>
          <span className="mbd2-text">{t("mobile.settings", "Settings")}</span>
        </a>
      </nav>
    </div>
  );
}
