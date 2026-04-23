"use client";

import { useState } from "react";

import "@/features/dashboard/pages/DashboardPage.css";
import "./VipPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { useVipData } from "@/features/dashboard/hooks/useVipData";
import { resolveAssetUrl } from "@/shared/utils/assetUrl";

type TierStyle = "bronze" | "silver" | "gold" | "platinum" | "diamond";

type VipTierDefinition = {
  id: string;
  name: string;
  icon: string;
  accentClass: TierStyle;
  subtitle: string;
  perks: string[];
};

const VIP_TIERS: VipTierDefinition[] = [
  {
    id: "bronze",
    name: "Bronze",
    icon: "fa-solid fa-shield",
    accentClass: "bronze",
    subtitle: "Starter tier for new players",
    perks: [
      "Fund your wallet with up to $100",
      "Wager up to $500 total",
      "Complete 3 active play sessions",
      "Verify your account",
    ],
  },
  {
    id: "silver",
    name: "Silver",
    icon: "fa-solid fa-medal",
    accentClass: "silver",
    subtitle: "For consistent active members",
    perks: [
      "Fund your wallet with up to $500",
      "Wager up to $2,500 total",
      "Maintain activity for 7 days",
      "Complete 10 play sessions",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    icon: "fa-solid fa-crown",
    accentClass: "gold",
    subtitle: "Premium rewards begin here",
    perks: [
      "Fund your wallet with up to $1,500",
      "Wager up to $10,000 total",
      "Complete 25 play sessions",
      "Maintain steady weekly activity",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    icon: "fa-solid fa-gem",
    accentClass: "platinum",
    subtitle: "High-value player recognition",
    perks: [
      "Fund your wallet with up to $5,000",
      "Wager up to $30,000 total",
      "Complete 60 play sessions",
      "Maintain strong monthly activity",
    ],
  },
  {
    id: "diamond",
    name: "Diamond",
    icon: "fa-solid fa-award",
    accentClass: "diamond",
    subtitle: "Top tier for elite members",
    perks: [
      "Fund your wallet with $10,000+",
      "Wager up to $75,000 total",
      "Complete 120 play sessions",
      "Maintain elite monthly engagement",
    ],
  },
];

function toTierStyle(levelName?: string): TierStyle {
  const normalized = levelName?.trim().toLowerCase();
  if (normalized === "bronze") return "bronze";
  if (normalized === "silver") return "silver";
  if (normalized === "gold") return "gold";
  if (normalized === "platinum") return "platinum";
  if (normalized === "diamond") return "diamond";
  return "gold";
}

function formatCurrency(value: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "0";
  }

  return numeric.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

export function VipPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();
  const { snapshot, normalizedLevelName } = useVipData();
  const [showStatusCard, setShowStatusCard] = useState(false);

  if (isChecking) {
    return <div className="dashboard-auth-loading" aria-hidden="true"></div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const avatarSrc = resolveAssetUrl(profile.avatarUrl) || "https://i.pravatar.cc/150?img=12";
  const currentTierClass = toTierStyle(snapshot.levelName);
  const progressToText = snapshot.nextLevelName
    ? `Progress to ${snapshot.nextLevelName}`
    : "Top tier reached";

  const nextTierIndex = VIP_TIERS.findIndex((t) => t.id === normalizedLevelName) + 1;
  const nextTier = VIP_TIERS[nextTierIndex];

  const getConditionDetails = (perk: string) => {
    const text = perk.toLowerCase();
    let current = 0;
    let required = 1;
    let isDone = false;

    if (text.includes("wager")) {
      required =
        nextTier?.id === "bronze"
          ? 500
          : nextTier?.id === "silver"
            ? 2500
            : nextTier?.id === "gold"
              ? 10000
              : nextTier?.id === "platinum"
                ? 30000
                : 75000;
      current = Number(snapshot.totalWager);
      isDone = current >= required;
    } else if (text.includes("fund") || text.includes("deposit")) {
      required =
        nextTier?.id === "bronze"
          ? 100
          : nextTier?.id === "silver"
            ? 500
            : nextTier?.id === "gold"
              ? 1500
              : nextTier?.id === "platinum"
                ? 5000
                : 10000;
      current = Number(snapshot.totalDeposits);
      isDone = current >= required;
    } else if (text.includes("session")) {
      required =
        nextTier?.id === "bronze"
          ? 3
          : nextTier?.id === "silver"
            ? 10
            : nextTier?.id === "gold"
              ? 25
              : nextTier?.id === "platinum"
                ? 60
                : 120;
      current = snapshot.totalSessions;
      isDone = current >= required;
    } else if (text.includes("activity") || text.includes("engagement")) {
      required =
        nextTier?.id === "bronze" ? 1 : nextTier?.id === "silver" ? 7 : nextTier?.id === "gold" ? 14 : nextTier?.id === "platinum" ? 30 : 60;
      current = snapshot.daysActive || 0;
      isDone = current >= required;
    } else if (text.includes("verify")) {
      required = 1;
      current = snapshot.isVerified ? 1 : 0;
      isDone = snapshot.isVerified;
    }

    return {
      isDone,
      percent: Math.min(1, current / required),
    };
  };

  const perks = nextTier?.perks || [];
  const perkDetails = perks.map(getConditionDetails);
  const totalPerks = perks.length || 1;
  const compositeProgress = Math.floor(
    (perkDetails.reduce((acc, curr) => acc + curr.percent, 0) / totalPerks) * 100
  );

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
            displayName={profile.displayName}
            country={profile.country}
            phoneNumber={profile.phoneNumber}
            phoneCountryCode={profile.phoneCountryCode}
            preferredLanguage={profile.preferredLanguage}
            dateOfBirth={profile.dateOfBirth}
            walletHref="/dashboard/wallet"
          />

          <div className="krabet-wallet-content">
            <div className="vip-page">
              <div className="vip-shell">
                <section className="vip-hero">
                  <div className="vip-hero-pill">
                    <i className="fa-solid fa-star"></i>
                    Membership Tiers
                  </div>

                  <h1>Rise Through The VIP Ranks</h1>
                  <p>
                    Unlock higher status, sharper rewards, and premium recognition as your
                    activity grows across the platform.
                  </p>
                </section>

                <section
                  className="vip-user-bar"
                  onClick={() => setShowStatusCard(true)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="vip-user-left">
                    <img src={avatarSrc} alt="user" className="vip-user-avatar" />

                    <div className="vip-user-info">
                      <span className="vip-username">{profile.displayName || profile.username}</span>
                      <span className={`vip-user-tier ${currentTierClass}`}>
                        <i className="fa-solid fa-crown"></i>
                        {snapshot.levelName} Tier
                      </span>
                    </div>
                  </div>

                  <div className="vip-user-progress">
                    <div className="vip-user-progress-info">
                      <span>{progressToText}</span>
                      <span className="vip-user-progress-pct">{compositeProgress}%</span>
                    </div>
                    <div className="vip-progress-bar">
                      <div className="vip-progress-fill" style={{ width: `${compositeProgress}%` }}></div>
                    </div>
                  </div>
                </section>

                {showStatusCard && (
                  <VipStatusCard
                    snapshot={snapshot}
                    onClose={() => setShowStatusCard(false)}
                    currentTier={VIP_TIERS.find((t) => t.id === normalizedLevelName)}
                    nextTier={nextTier}
                    compositeProgress={compositeProgress}
                    getConditionDetails={getConditionDetails}
                  />
                )}

                <section className="vip-tier-grid">
                  {VIP_TIERS.map((tier) => (
                    <article
                      key={tier.id}
                      className={`vip-tier-card ${tier.accentClass} ${normalizedLevelName === tier.id ? "featured" : ""}`}
                    >
                      <div className="vip-tier-top">
                        <div className={`vip-badge-wrap ${tier.accentClass}`}>
                          <div className={`vip-badge ${tier.accentClass}`}>
                            <i className={tier.icon}></i>
                          </div>
                        </div>

                        <div className="vip-tier-copy">
                          <h2>{tier.name}</h2>
                          <p>{tier.subtitle}</p>
                        </div>
                      </div>

                      <div className="vip-criteria-tab">
                        <div className="vip-criteria-tab-head">
                          <span>
                            <i className="fa-solid fa-list-check"></i>
                            Tier Criteria
                          </span>
                        </div>

                        <ul className="vip-criteria-list">
                          {tier.perks.map((perk) => (
                            <li key={perk}>
                              <i className="fa-solid fa-check"></i>
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  ))}
                </section>
              </div>
            </div>
          </div>

          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
function VipStatusCard({
  snapshot,
  onClose,
  currentTier,
  nextTier,
  compositeProgress,
  getConditionDetails,
}: {
  snapshot: any;
  onClose: () => void;
  currentTier?: VipTierDefinition;
  nextTier?: VipTierDefinition;
  compositeProgress: number;
  getConditionDetails: (perk: string) => { isDone: boolean; percent: number };
}) {
  const currentTierClass = toTierStyle(snapshot.levelName);
  const nextTierClass = nextTier ? toTierStyle(nextTier.name) : currentTierClass;

  return (
    <div className="vip-modal-overlay" onClick={onClose}>
      <div className="vip-status-card" onClick={(e) => e.stopPropagation()}>
        <button className="vip-modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="vip-card-header">
          <div className={`vip-card-badge ${currentTierClass}`}>
            <i className={currentTier?.icon || "fa-solid fa-crown"}></i>
          </div>
          <div className="vip-card-title">
            <h3>{snapshot.levelName} Tier</h3>
            <p>Current Membership Status</p>
          </div>
        </div>

        <div className="vip-card-stats-grid">
          <div className="vip-stat-item">
            <span className="vip-stat-label">Total Deposits</span>
            <span className="vip-stat-value">${formatCurrency(snapshot.totalDeposits)}</span>
          </div>
          <div className="vip-stat-item">
            <span className="vip-stat-label">Sessions Played</span>
            <span className="vip-stat-value">{snapshot.totalSessions}</span>
          </div>
          <div className="vip-stat-item">
            <span className="vip-stat-label">Days Active</span>
            <span className="vip-stat-value">{snapshot.daysActive}</span>
          </div>
          <div className="vip-stat-item">
            <span className="vip-stat-label">Status</span>
            <span className="vip-stat-value">{snapshot.isVerified ? "Verified" : "Pending"}</span>
          </div>
        </div>

        <div className="vip-card-progress-section">
          <div className="vip-progress-header">
            <span>Progress to {nextTier?.name || "Max Level"}</span>
            <span className="vip-progress-pct">{compositeProgress}%</span>
          </div>
          <div className="vip-progress-bar-large">
            <div
              className={`vip-progress-fill-large ${nextTierClass}`}
              style={{ width: `${compositeProgress}%` }}
            ></div>
          </div>
        </div>

        {nextTier && (
          <div className="vip-card-conditions">
            <h4>Next Level Requirements</h4>
            <ul className="vip-condition-list">
              {nextTier.perks.map((perk) => {
                const { isDone } = getConditionDetails(perk);
                return (
                  <li key={perk} className={isDone ? "met" : "pending"}>
                    <div className="condition-check">
                      {isDone ? (
                        <i className="fa-solid fa-circle-check"></i>
                      ) : (
                        <i className="fa-regular fa-circle"></i>
                      )}
                    </div>
                    <span>{perk}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
