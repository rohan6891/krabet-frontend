"use client";

import { useI18n } from "@/shared/i18n/useI18n";

export const sidebarTopLinks = [
  { key: "nav.casino", label: "Casino", href: "/dashboard", icon: "fa-solid fa-dice-d6" },
  { key: "nav.mines", label: "Mines", href: "/dashboard/mines", icon: "fa-solid fa-bomb" },
  { key: "nav.limbo", label: "Limbo", href: "/dashboard/limbo", icon: "fa-solid fa-rocket" },
  { key: "nav.crash", label: "Crash", href: "/dashboard/crash", icon: "fa-solid fa-chart-line" },
  { key: "nav.dice", label: "Dice", href: "/dashboard/dice", icon: "fa-solid fa-dice" },
  { key: "nav.coinflip", label: "Coinflip", href: "/dashboard/coinflip", icon: "fa-solid fa-coins" },
  { key: "nav.search", label: "Search", href: "/dashboard/search", icon: "fa-solid fa-magnifying-glass" },
  { key: "nav.wallet", label: "Wallet", href: "/dashboard/wallet", icon: "fa-solid fa-wallet" },
];

export const sidebarBottomLinks = [
  { key: "nav.promotions", label: "Promotions", href: "/dashboard", icon: "fa-solid fa-gift" },
  { key: "nav.vipClub", label: "VIP Club", href: "/dashboard", icon: "fa-solid fa-crown" },
  { key: "nav.bonus", label: "Bonus", href: "/dashboard", icon: "fa-solid fa-coins" },
  { key: "nav.referral", label: "Referral", href: "/dashboard", icon: "fa-solid fa-user-plus" },
  { key: "nav.form", label: "Form", href: "/dashboard/settings", icon: "fa-regular fa-file-lines" },
  { key: "nav.responsibleGambling", label: "Responsible Gambling", href: "/dashboard/settings", icon: "fa-solid fa-shield-halved" },
];

type DashboardSidebarProps = {
  logoSrc: string;
};

export function DashboardSidebar({ logoSrc }: DashboardSidebarProps) {
  const { t } = useI18n();

  return (
    <aside className="krabet-sidebar">
      <a href="/dashboard" className="sidebar-logo-link">
        <img src={logoSrc} alt="KraBet logo" className="sidebar-logo-image" />
      </a>

      <div className="sidebar-panel sidebar-panel-top">
        {sidebarTopLinks.map((item) => (
          <a href={item.href} className="sidebar-link" key={item.label}>
            <span className="sidebar-link-icon">
              <i className={item.icon} aria-hidden="true"></i>
            </span>
            <span className="sidebar-link-text">{t(item.key, item.label)}</span>
          </a>
        ))}
      </div>

      <div className="sidebar-panel sidebar-panel-bottom">
        {sidebarBottomLinks.map((item) => (
          <a href={item.href} className="sidebar-link" key={item.label}>
            <span className="sidebar-link-icon">
              <i className={item.icon} aria-hidden="true"></i>
            </span>
            <span className="sidebar-link-text">{t(item.key, item.label)}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}
