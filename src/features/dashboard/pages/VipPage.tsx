"use client";

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
            vipTier={snapshot.levelName}
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

                <section className="vip-user-bar">
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
                    <span>{progressToText}</span>
                    <div className="vip-progress-bar">
                      <div className="vip-progress-fill" style={{ width: `${snapshot.progressPercent}%` }}></div>
                    </div>
                    <span>
                      Total wagered: ${formatCurrency(snapshot.totalWager)}
                      {snapshot.nextLevelRequiredWager ? ` / ${formatCurrency(snapshot.nextLevelRequiredWager)}` : ""}
                    </span>
                  </div>
                </section>

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
