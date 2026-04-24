"use client";

import Link from "next/link";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import "@/features/dashboard/pages/DashboardPage.css";
import "./ComingSoonPage.css";

export default function ComingSoonPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();

  if (isChecking) return <div className="dashboard-auth-loading" aria-hidden="true" />;
  if (!isAuthenticated) return null;

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

          <div className="krabet-wallet-content">
            <section className="cs-page-shell">
              <div className="cs-content">
                <div className="cs-visual">
                  <div className="cs-circle cs-circle--1" />
                  <div className="cs-circle cs-circle--2" />
                  <div className="cs-icon">
                    <i className="fa-solid fa-rocket" />
                  </div>
                </div>
                
                <p className="cs-tag">Under Construction</p>
                <h1>Coming Very Soon</h1>
                <p className="cs-desc">
                  We're cooking up something big. This feature is currently being tested by our elite squad 
                  to ensure the smoothest experience for you. Hang tight!
                </p>

                <div className="cs-actions">
                  <Link href="/dashboard/settings" className="cs-btn cs-btn--primary">
                    Back to Settings
                  </Link>
                  <Link href="/dashboard/categories/casino" className="cs-btn cs-btn--ghost">
                    Play Games
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
