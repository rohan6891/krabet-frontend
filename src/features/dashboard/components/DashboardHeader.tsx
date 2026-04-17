"use client";

import { useEffect, useState } from "react";
import { ProfileAvatar } from "@/features/dashboard/components/ProfileAvatar";
import { NotificationPanel, ProfilePanel } from "@/features/dashboard/components/HeaderPopups";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useSession } from "@/shared/hooks/useSession";

const topNavLinks = [
  { label: "Casino", href: "/dashboard", active: true },
  { label: "Sports", href: "#" },
  { label: "Live", href: "#" },
  { label: "Promotions", href: "#" },
];

type DashboardHeaderProps = {
  walletBalance: string;
  username: string;
  email?: string;
  avatarUrl: string | null;
  walletHref?: string;
  onAlertsClick?: () => void;
};

export function DashboardHeader({
  walletBalance,
  username,
  email = "",
  avatarUrl,
  walletHref = "/dashboard/wallet",
  onAlertsClick,
}: DashboardHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { notifications, unreadCount, loading, reload, markRead, markAllRead } =
    useNotifications();
  const { logout } = useSession();

  useEffect(() => {
    const openNotifications = () => {
      setProfileOpen(false);
      setNotifOpen(true);
      reload();
    };

    window.addEventListener("krabets:open-notifications", openNotifications);
    return () => {
      window.removeEventListener("krabets:open-notifications", openNotifications);
    };
  }, [reload]);

  const handleNotifToggle = () => {
    setProfileOpen(false);
    const willOpen = !notifOpen;
    setNotifOpen(willOpen);
    if (willOpen) reload();
  };

  const handleProfileToggle = () => {
    setNotifOpen(false);
    setProfileOpen((p) => !p);
  };

  return (
    <>
      <header className="krabet-header">
        <nav className="header-nav">
          {topNavLinks.map((item) => (
            <a href={item.href} key={item.label} className={`header-nav-link ${item.active ? "active" : ""}`}>
              {item.label}
            </a>
          ))}
        </nav>

        <a href="/dashboard" className="header-mobile-logo-link" aria-label="KraBets Home">
          <img src="/KRABETS-LOGO.png" alt="KraBet logo" className="header-mobile-logo-image" />
        </a>

        <div className="header-actions">
          <a href={walletHref} className="wallet-pill">
            <span className="wallet-pill-icon">
              <i className="fa-solid fa-wallet" aria-hidden="true"></i>
            </span>
            <span className="wallet-pill-text">
              <span className="wallet-amount">${walletBalance}</span>
            </span>
          </a>

          <a href="/dashboard/search" className="header-icon-btn" aria-label="Search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          </a>

          <button
            className="header-icon-btn"
            aria-label="Notifications"
            onClick={() => {
              handleNotifToggle();
              if (onAlertsClick) onAlertsClick();
            }}
            style={{ position: "relative" }}
          >
            <i className="fa-solid fa-bell" aria-hidden="true"></i>
            {unreadCount > 0 && (
              <span className="header-notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>

          <a href="/dashboard/settings" className="header-icon-btn" aria-label="Settings">
            <i className="fa-solid fa-gear" aria-hidden="true"></i>
          </a>

          <button className="profile-link" aria-label="Profile" onClick={handleProfileToggle}>
            <ProfileAvatar username={username} avatarUrl={avatarUrl} />
          </button>
        </div>
      </header>

      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />

      <ProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        username={username}
        email={email}
        avatarUrl={avatarUrl}
        walletBalance={walletBalance}
        onLogout={logout}
      />
    </>
  );
}
