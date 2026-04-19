"use client";

import "./DashboardPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { HeroSection } from "@/features/dashboard/components/HeroSection";
import { RecentWinsStrip } from "@/features/dashboard/components/RecentWinsStrip";
import { GameCategoriesSection } from "@/features/dashboard/components/GameCategoriesSection";
import { OriginalsSection } from "@/features/dashboard/components/OriginalsSection";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";

export function DashboardPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { loading, categories, originals, recentWins, walletBalance, profile } = useDashboardData();

  if (isChecking) {
    return <div className="dashboard-auth-loading" aria-hidden="true"></div>;
  }

  if (!isAuthenticated) {
    return null;
  }

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
          />

          <div className="krabet-content">
            <HeroSection promoBanner="/promo-img.jpg" />
            {!loading && recentWins.length > 0 ? <RecentWinsStrip wins={recentWins} /> : null}
            <GameCategoriesSection games={categories} loading={loading} />
            <OriginalsSection games={originals} loading={loading} />
          </div>

          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
