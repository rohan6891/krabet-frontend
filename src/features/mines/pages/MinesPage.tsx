"use client";

import Link from "next/link";
import "@/features/dashboard/pages/DashboardPage.css";
import "./MinesPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";

export function MinesPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();

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
          />

          <div className="krabet-content mines-route-wrap">
            <section className="mines-card">
              <h1>MINES</h1>
              <p>The mines interface is now routed correctly. Game UI can be expanded here.</p>

              <div className="mines-actions">
                <Link href="/dashboard" className="mines-btn secondary">
                  Back To Dashboard
                </Link>
                <Link href="/dashboard/wallet" className="mines-btn primary">
                  Open Wallet
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
