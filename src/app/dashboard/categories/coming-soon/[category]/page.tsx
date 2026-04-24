"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import "@/features/dashboard/pages/DashboardPage.css";
import "./ComingSoonPage.css";

const LABELS: Record<string, string> = {
  sports: "Sports",
  live: "Live",
  lottery: "Lottery",
  "crypto-futures": "Crypto Futures",
  promotions: "Promotions",
  bonus: "Bonus",
  referral: "Referral",
  form: "Form",
  "responsible-gambling": "Responsible Gambling",
};

export default function CategoryComingSoonRoutePage() {
  const params = useParams<{ category: string }>();
  const key = (params?.category || "sports").toLowerCase();
  const label = LABELS[key] || "Category";

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
            <section className="coming-funky-shell">
              <div className="coming-spark" aria-hidden="true"></div>
              <div className="coming-main-card">
                <p className="coming-pill">Launching Soon</p>
                <h1>{label} Arena Is Almost Here</h1>
                <p>
                  We are polishing this zone with fresh odds, new lobbies and wild weekly rewards.
                </p>

                <div className="coming-cta-row">
                  <Link href="/dashboard/wallet" className="coming-btn-primary">
                    Deposit Now
                  </Link>
                  <Link href="/dashboard/categories/casino" className="coming-btn-ghost">
                    Play Casino
                  </Link>
                </div>
              </div>

              <div className="coming-image-strip">
                <article className="coming-image-card">
                  <img src="/crash2.png" alt="Crash game preview" />
                </article>
                <article className="coming-image-card">
                  <img src="/mines2.png" alt="Mines game preview" />
                </article>
                <article className="coming-image-card">
                  <img src="/limbo2.png" alt="Limbo game preview" />
                </article>
              </div>
            </section>
          </div>

          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
