"use client";

import { useI18n } from "@/shared/i18n/useI18n";

type SidebarLinkItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
};

export const sidebarTopLinks: SidebarLinkItem[] = [
  { key: "nav.casino", label: "Casino", href: "/dashboard", icon: "fa-solid fa-dice-d6" },
  { key: "nav.sports", label: "Sports", href: "#", icon: "fa-solid fa-futbol" },
  { key: "nav.lottery", label: "Lottery", href: "#", icon: "fa-solid fa-ticket" },
  { key: "nav.cryptoFutures", label: "Crypto Futures", href: "#", icon: "fa-solid fa-bitcoin-sign" },
];

export const sidebarBottomLinks: SidebarLinkItem[] = [
  { key: "nav.promotions", label: "Promotions", href: "#", icon: "fa-solid fa-gift" },
  { key: "nav.vipClub", label: "VIP Club", href: "/dashboard/vip", icon: "fa-solid fa-crown" },
  { key: "nav.bonus", label: "Bonus", href: "#", icon: "fa-solid fa-coins" },
  { key: "nav.referral", label: "Referral", href: "#", icon: "fa-solid fa-user-plus" },
  { key: "nav.form", label: "Form", href: "#", icon: "fa-regular fa-file-lines" },
  { key: "nav.responsibleGambling", label: "Responsible Gambling", href: "#", icon: "fa-solid fa-shield-halved" },
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

      {sidebarBottomLinks.length > 0 ? (
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
      ) : null}
    </aside>
  );
}
