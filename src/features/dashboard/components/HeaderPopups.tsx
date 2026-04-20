"use client";

import { useEffect, useRef, useState } from "react";
import type { NotificationItem } from "@/features/notifications/types/notification.types";
import { useI18n } from "@/shared/i18n/useI18n";
import { resolveAssetUrl } from "@/shared/utils/assetUrl";
import "./HeaderPopups.css";

/* ─── helpers ─────────────────────────────────────────── */
function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function notifIcon(type: string): string {
  switch (type) {
    case "deposit_success":
    case "deposit_confirmed":
      return "fa-circle-check";
    case "withdraw_requested":
    case "withdrawal_requested": return "fa-arrow-up";
    case "withdraw_processing":
      return "fa-hourglass-half";
    case "withdraw_failed":
      return "fa-triangle-exclamation";
    case "withdraw_completed":
    case "withdrawal_completed": return "fa-check-circle";
    case "security_alert": return "fa-shield-halved";
    case "bonus": return "fa-gift";
    default: return "fa-bell";
  }
}

/* ─── Notification Panel ──────────────────────────────── */
type NotificationPanelProps = {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
};

export function NotificationPanel({
  open,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="header-popup-overlay" onClick={onClose}>
      <div
        className="header-popup notifications-panel"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="header-popup-top">
          <div className="header-popup-title-wrap">
            <span className="header-popup-title-icon">
              <i className="fa-solid fa-bell" aria-hidden="true" />
            </span>
            <h3 className="header-popup-title">Recent Notifications</h3>
          </div>

          <button
            type="button"
            className="header-popup-close"
            onClick={onClose}
            aria-label="Close notifications panel"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="header-popup-body notifications-list">
          {loading && notifications.length === 0 && (
            <div className="hp-empty">
              <i className="fa-solid fa-spinner fa-spin" />
              <span>Loading...</span>
            </div>
          )}
          {!loading && notifications.length === 0 && (
            <div className="hp-empty">
              <i className="fa-solid fa-bell-slash" />
              <p>No notifications yet</p>
            </div>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notification-item ${n.is_read ? "" : "unread"}`}
              onClick={() => { if (!n.is_read) onMarkRead(n.id); }}
            >
              <div className="notification-icon">
                <i className={`fa-solid ${notifIcon(n.type)}`} aria-hidden="true" />
              </div>
              <div className="notification-content">
                <div className="notification-title-row">
                  <h4 className="notification-title">{n.title}</h4>
                  <span className="notification-time">{formatTimeAgo(n.created_at)}</span>
                </div>
                <p className="notification-message">{n.message}</p>
              </div>
            </div>
          ))}

          {unreadCount > 0 && (
            <button className="hp-mark-all-btn" onClick={onMarkAllRead}>
              Mark all as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Panel ───────────────────────────────────── */
type ProfilePanelProps = {
  open: boolean;
  onClose: () => void;
  username: string;
  email: string;
  avatarUrl: string | null;
  walletBalance: string;
  displayName?: string;
  country?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  preferredLanguage?: string;
  dateOfBirth?: string;
  onLogout?: () => void;
};

function profileValue(value?: string | null, fallback = "N/A"): string {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

export function ProfilePanel({
  open,
  onClose,
  username,
  email,
  avatarUrl,
  walletBalance,
  displayName,
  country,
  phoneNumber,
  phoneCountryCode,
  preferredLanguage,
  dateOfBirth,
  onLogout,
}: ProfilePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);
  const { t } = useI18n();
  const avatarSrc = resolveAssetUrl(avatarUrl);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  const initial = (username || "U")[0].toUpperCase();
  const fullPhone = [phoneCountryCode, phoneNumber].filter(Boolean).join(" ").trim();

  return (
    <div className="header-popup-overlay" onClick={onClose}>
      <div
        className="header-popup user-panel"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="header-popup-top">
          <div className="header-popup-title-wrap">
            <span className="header-popup-title-icon">
              <i className="fa-solid fa-id-card" aria-hidden="true" />
            </span>
            <h3 className="header-popup-title">{t("profile.panelTitle", "My Profile")}</h3>
          </div>

          <button
            type="button"
            className="header-popup-close"
            onClick={onClose}
            aria-label="Close user panel"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="header-popup-body">
          {/* Avatar + Name */}
          <div className="user-card-hero">
            <div className="user-card-avatar-wrap">
              {avatarSrc && !imageError ? (
                <img src={avatarSrc} alt={username} className="user-card-avatar" onError={() => setImageError(true)} />
              ) : (
                <div className="user-card-avatar user-card-avatar--initial">
                  {initial}
                </div>
              )}
            </div>

            <div className="user-card-main-info">
              <h2 className="user-card-name">{profileValue(displayName || username)}</h2>
              <p className="user-card-username">@{username.toLowerCase()}</p>

              <div className="user-card-badges">
                <span className="user-badge vip-badge">
                  <i className="fa-solid fa-crown" aria-hidden="true" />
                  VIP Gold
                </span>
                <span className="user-badge verified-badge">
                  <i className="fa-solid fa-circle-check" aria-hidden="true" />
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="user-balance-card">
            <div className="user-balance-label">
              <i className="fa-solid fa-wallet" aria-hidden="true" />
              {" "}{t("profile.walletBalance", "Wallet Balance")}
            </div>
            <div className="user-balance-value">${walletBalance}</div>
            <div className="user-balance-sub">1.25 BTC</div>
          </div>

          {/* Info Grid */}
          <div className="user-info-grid">
            <div className="user-info-item">
              <span className="user-info-label">
                <i className="fa-solid fa-envelope" aria-hidden="true" />
                {t("profile.email", "Email")}
              </span>
              <span className="user-info-value">{profileValue(email, t("common.na", "N/A"))}</span>
            </div>
            <div className="user-info-item">
              <span className="user-info-label">
                <i className="fa-solid fa-globe" aria-hidden="true" />
                {t("profile.country", "Country")}
              </span>
              <span className="user-info-value">{profileValue(country, t("common.na", "N/A"))}</span>
            </div>
            <div className="user-info-item">
              <span className="user-info-label">
                <i className="fa-solid fa-phone" aria-hidden="true" />
                {t("profile.phone", "Phone")}
              </span>
              <span className="user-info-value">{profileValue(fullPhone, t("common.na", "N/A"))}</span>
            </div>
            <div className="user-info-item">
              <span className="user-info-label">
                <i className="fa-solid fa-calendar-days" aria-hidden="true" />
                {t("profile.dateOfBirth", "Date of Birth")}
              </span>
              <span className="user-info-value">{profileValue(dateOfBirth, t("common.na", "N/A"))}</span>
            </div>
            <div className="user-info-item">
              <span className="user-info-label">
                <i className="fa-solid fa-language" aria-hidden="true" />
                {t("profile.language", "Language")}
              </span>
              <span className="user-info-value">{profileValue(preferredLanguage, t("common.na", "N/A"))}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="user-panel-actions">
            <a href="/dashboard/wallet" className="user-panel-btn primary">
              <i className="fa-solid fa-wallet" aria-hidden="true" />
              My Wallet
            </a>
            <a href="/dashboard/settings" className="user-panel-btn secondary">
              <i className="fa-solid fa-gear" aria-hidden="true" />
              Account Settings
            </a>
            <button
              type="button"
              className="user-panel-btn danger"
              onClick={() => {
                onClose();
                onLogout?.();
              }}
            >
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
              {t("profile.logout", "Logout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
