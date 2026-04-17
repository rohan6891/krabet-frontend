"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { getAccessTokenFromStorage } from "@/shared/utils/session";
import { updateProfile, changePassword } from "@/features/settings/api/settings.api";
import { fetchMe } from "@/features/dashboard/api/dashboard.api";
import "@/features/dashboard/pages/DashboardPage.css";
import "./SettingsPage.css";

function Toggle({ checked, onChange, label, compact = false }: any) {
  return (
    <button
      type="button"
      className={`settings-toggle ${checked ? "is-on" : ""} ${compact ? "settings-toggle--compact" : ""}`}
      onClick={onChange}
      aria-pressed={checked}
      aria-label={label}
    >
      <span className="settings-toggle__thumb" />
    </button>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="settings-section__header">
      <div className="settings-section__title-wrap">
        <span className="settings-section__icon">
          <i className={icon} />
        </span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function ActionRow({ icon, label, onClick, rightSide }: any) {
  return (
    <div className="settings-action-row" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="settings-action-row__left">
        <span className="settings-action-row__icon">
          <i className={icon} />
        </span>
        <span>{label}</span>
      </div>
      <div className="settings-action-row__right">
        {rightSide}
        {!rightSide && (
          <span className="settings-action-row__chevron">
            <i className="fa-solid fa-angle-right" />
          </span>
        )}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();

  const [displayName, setDisplayName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState({ text: "", type: "" });

  const [preferences, setPreferences] = useState({
    twoFactor: false,
    emailAccount: true,
    emailPromotions: false,
    emailOffers: true,
    sms: false,
    push: false,
    promoOffers: true,
  });

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (!token) return;
    fetchMe(token)
      .then((res) => {
        if (res.success && res.data?.user) {
          setDisplayName(res.data.user.displayName || res.data.user.username || "");
        }
      })
      .catch(() => {});
  }, []);

  if (isChecking) return <div className="dashboard-auth-loading" aria-hidden="true" />;
  if (!isAuthenticated) return null;

  const handleProfileSave = async () => {
    const token = getAccessTokenFromStorage();
    if (!token) return;
    setProfileLoading(true);
    setProfileMessage({ text: "", type: "" });
    try {
      const res = await updateProfile(token, { displayName });
      if (res.success) {
        setProfileMessage({ text: "Profile updated successfully!", type: "success" });
      }
    } catch (err: any) {
      setProfileMessage({ text: err?.message || "Failed to update profile", type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwMessage({ text: "", type: "" });
    if (newPw !== confirmPw) {
      setPwMessage({ text: "Passwords do not match", type: "error" });
      return;
    }
    if (newPw.length < 8) {
      setPwMessage({ text: "Password must be at least 8 characters", type: "error" });
      return;
    }
    const token = getAccessTokenFromStorage();
    if (!token) return;
    setPwLoading(true);
    try {
      const res = await changePassword(token, { currentPassword: currentPw, newPassword: newPw });
      if (res.success) {
        setPwMessage({ text: "Password changed successfully!", type: "success" });
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        setTimeout(() => setPwModalOpen(false), 1500);
      }
    } catch (err: any) {
      setPwMessage({ text: err?.message || "Failed to change password", type: "error" });
    } finally {
      setPwLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const initial = (profile.username || "U")[0].toUpperCase();

  return (
    <div className="krabet-page">
      <div className="krabet-shell">
        <DashboardSidebar logoSrc="/KRABETS-LOGO.png" />
        <main className="krabet-main">
          <DashboardHeader
            walletBalance={walletBalance}
            username={profile.username}
            email={profile.email}
            avatarUrl={profile.avatarUrl}
          />

          <div className="krabet-wallet-content">
            <section className="settings-page-shell">
              <div className="settings-page-bg" />

              <div className="settings-page-content">
                <div className="settings-page-title-wrap">
                  <h1 className="settings-page-title">Settings</h1>
                  <p className="settings-page-subtitle">
                    Manage your profile, security, preferences, and support options.
                  </p>
                </div>

                <div className="settings-sections-stack">
                  <div className="settings-grid">
                    {/* Left Column: Profile */}
                    <section className="settings-section settings-section--profile">
                      <SectionHeader icon="fa-solid fa-user" title="Account / Profile" />
                      <p className="settings-section__description">
                        Core identity and personal information.
                      </p>

                      <div className="settings-field-grid">
                        <label className="settings-label-group">
                          <span><i className="fa-solid fa-id-card" /> Display Name</span>
                          <input
                            type="text"
                            placeholder="Enter display name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                          />
                        </label>

                        <label className="settings-label-group">
                          <span><i className="fa-solid fa-at" /> Username</span>
                          <input type="text" value={profile.username} disabled className="disabled" />
                        </label>

                        <label className="settings-label-group">
                          <span><i className="fa-solid fa-envelope" /> Email Address</span>
                          <input type="email" value={profile.email || ""} disabled className="disabled" />
                        </label>

                        <label className="settings-label-group">
                          <span><i className="fa-solid fa-phone" /> Phone Number</span>
                          <input type="tel" placeholder="Enter phone number" />
                        </label>

                        <label className="settings-label-group">
                          <span><i className="fa-solid fa-calendar-days" /> Date of Birth</span>
                          <input type="date" />
                        </label>

                        <label className="settings-label-group">
                          <span><i className="fa-solid fa-earth-africa" /> Country / Region</span>
                          <input type="text" placeholder="Enter country or region" />
                        </label>

                        <label className="settings-label-group settings-label-group--full">
                          <span><i className="fa-solid fa-language" /> Preferred Language</span>
                          <select defaultValue="English">
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                          </select>
                        </label>
                      </div>

                      <div className="settings-profile-picture">
                        <div className="settings-profile-picture__left">
                          <div className="settings-avatar">
                            {profile.avatarUrl ? (
                              <img src={profile.avatarUrl} alt="avatar" className="settings-avatar__image" />
                            ) : (
                              <span>{initial}</span>
                            )}
                          </div>
                          <div className="settings-profile-picture__meta">
                            <h4>Profile Picture</h4>
                            <p>Optional. JPG, PNG or WEBP. Max 5MB.</p>
                          </div>
                        </div>

                        <div className="settings-profile-picture__actions">
                          <button className="settings-btn settings-btn--secondary" type="button">
                            <i className="fa-solid fa-upload" />
                            <span>Upload</span>
                          </button>
                        </div>
                      </div>

                      <div className="settings-section__footer" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                          className="settings-btn settings-btn--primary"
                          type="button"
                          onClick={handleProfileSave}
                          disabled={profileLoading}
                        >
                          <i className="fa-solid fa-floppy-disk" />
                          <span>{profileLoading ? "Saving..." : "Save Changes"}</span>
                        </button>
                        {profileMessage.text && (
                          <span style={{ color: profileMessage.type === "error" ? "#ff7aa5" : "#4ade80", fontSize: "0.9rem", fontWeight: "600" }}>
                            {profileMessage.text}
                          </span>
                        )}
                      </div>
                    </section>

                    {/* Right Column: Security & Notifications */}
                    <div className="settings-side-stack">
                      <section className="settings-section">
                        <SectionHeader icon="fa-solid fa-shield-halved" title="Security Settings" />

                        <div className="settings-action-list">
                          <ActionRow
                            icon="fa-solid fa-key"
                            label="Change Password"
                            onClick={() => setPwModalOpen(true)}
                          />

                          <ActionRow
                            icon="fa-solid fa-mobile-screen-button"
                            label="Two-Factor Authentication"
                            onClick={() => {}}
                            rightSide={
                              <Toggle
                                checked={preferences.twoFactor}
                                onChange={() => handleToggle("twoFactor")}
                                compact
                              />
                            }
                          />

                          <ActionRow
                            icon="fa-solid fa-clock-rotate-left"
                            label="Login Activity / Session History"
                          />
                        </div>
                      </section>

                      <section className="settings-section">
                        <SectionHeader icon="fa-solid fa-bell" title="Notifications & Preferences" />

                        <div className="settings-notification-groups">
                          <div className="settings-inline-group">
                            <div className="settings-inline-group__label">
                              <i className="fa-solid fa-envelope-open-text" />
                              <span>I want to receive these in my Email</span>
                            </div>

                            <div className="settings-inline-group__controls settings-inline-group__controls--triple">
                              <button
                                type="button"
                                className={`settings-mini-pill ${preferences.emailAccount ? "is-active" : ""}`}
                                onClick={() => handleToggle("emailAccount")}
                              >
                                Account
                              </button>
                              <button
                                type="button"
                                className={`settings-mini-pill ${preferences.emailPromotions ? "is-active" : ""}`}
                                onClick={() => handleToggle("emailPromotions")}
                              >
                                Promotions
                              </button>
                              <button
                                type="button"
                                className={`settings-mini-pill ${preferences.emailOffers ? "is-active" : ""}`}
                                onClick={() => handleToggle("emailOffers")}
                              >
                                Offers
                              </button>
                            </div>
                          </div>

                          <div className="settings-toggle-row">
                            <div className="settings-toggle-row__label">
                              <i className="fa-solid fa-comment-sms" />
                              <span>SMS Notifications</span>
                            </div>
                            <Toggle checked={preferences.sms} onChange={() => handleToggle("sms")} />
                          </div>

                          <div className="settings-toggle-row">
                            <div className="settings-toggle-row__label">
                              <i className="fa-solid fa-mobile" />
                              <span>Push Notifications</span>
                            </div>
                            <Toggle checked={preferences.push} onChange={() => handleToggle("push")} />
                          </div>

                          <div className="settings-toggle-row">
                            <div className="settings-toggle-row__label">
                              <i className="fa-solid fa-gift" />
                              <span>Promotional Offers</span>
                            </div>
                            <Toggle checked={preferences.promoOffers} onChange={() => handleToggle("promoOffers")} />
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>

                  <section className="settings-section settings-section--support">
                    <SectionHeader icon="fa-solid fa-headset" title="Support & Help" />

                    <div className="settings-support-grid">
                      <ActionRow icon="fa-solid fa-life-ring" label="Contact Support" />
                      <ActionRow icon="fa-solid fa-comments" label="Live Chat" />
                      <ActionRow icon="fa-solid fa-circle-question" label="FAQ" />
                      <ActionRow icon="fa-solid fa-triangle-exclamation" label="Report a Problem" />
                      <ActionRow icon="fa-solid fa-user-slash" label="Account Closure Request" />
                    </div>
                  </section>
                </div>
              </div>
            </section>
          </div>

          <MobileBottomDock />
        </main>
      </div>

      {/* ─── Password Modal ─── */}
      {pwModalOpen && (
        <div className="settings-modal-overlay" onClick={() => setPwModalOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal__header">
              <div className="settings-modal__title-wrap">
                <span className="settings-modal__icon">
                  <i className="fa-solid fa-key" />
                </span>
                <h3>Change Password</h3>
              </div>
              <button className="settings-modal__close" onClick={() => setPwModalOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            
            <p className="settings-modal__description">
              For security, use a strong password you have not used anywhere else.
            </p>

            <div className="settings-modal__body">
              <div className="settings-field-grid settings-field-grid--single">
                <label className="settings-label-group">
                  <span>Current Password</span>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                  />
                </label>
                <label className="settings-label-group">
                  <span>New Password</span>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                  />
                </label>
                <label className="settings-label-group">
                  <span>Confirm New Password</span>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                  />
                </label>
              </div>

              {pwMessage.text && (
                <div style={{ marginTop: '12px', color: pwMessage.type === "error" ? "#ff7aa5" : "#4ade80", fontSize: '0.9rem', fontWeight: '600' }}>
                  {pwMessage.text}
                </div>
              )}
            </div>

            <div className="settings-modal__footer">
              <button className="settings-btn settings-btn--ghost" onClick={() => setPwModalOpen(false)}>
                <i className="fa-solid fa-ban" />
                <span>Cancel</span>
              </button>
              <button
                className="settings-btn settings-btn--primary"
                onClick={handlePasswordChange}
                disabled={pwLoading}
              >
                <i className="fa-solid fa-shield-halved" />
                <span>{pwLoading ? "Updating..." : "Update Password"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
