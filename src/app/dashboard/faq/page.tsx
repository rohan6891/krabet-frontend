"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import "@/features/dashboard/pages/DashboardPage.css";
import "./FAQPage.css";

const FAQ_DATA = [
  {
    question: "Is my money actually safe here?",
    answer: "Absolutely. We use industry-standard encryption and cold-storage solutions for all crypto assets. Your funds are only accessible by you, and our platform is built on top of secure, audited smart contracts where applicable. We prioritize transparency and security above all else."
  },
  {
    question: "Why do I need to verify my email?",
    answer: "Verifying your email is a crucial step in securing your account. it helps us ensure that you can recover your account if you lose access, and it prevents unauthorized access. Plus, it's how we send you important updates about your transactions and exclusive rewards!"
  },
  {
    question: "Can I really withdraw whenever I want?",
    answer: "Yes! There are no 'lock-in' periods. Once your deposit is confirmed on the blockchain and any active bonus wagering requirements (if you opted into one) are met, you can withdraw your balance instantly. Most withdrawals are processed within minutes."
  },
  {
    question: "What happens if my internet cuts out mid-game?",
    answer: "Don't panic! Our games are resolved server-side. For games like Crash, if you haven't cashed out and the connection drops, the game will continue until the multiplier crashes. For games like Mines or Limbo, the outcome is determined the moment you click 'Play', so your win will be credited even if you're offline."
  },
  {
    question: "Are the games actually fair or is it rigged?",
    answer: "We use a 'Provably Fair' system. This means every single roll, crash, or flip is generated using a transparent algorithm that you can verify yourself. We provide the seeds used for generation so you can cross-reference every outcome. We can't rig it even if we wanted to!"
  },
  {
    question: "I made a deposit but it hasn't shown up yet. Should I panic?",
    answer: "No need to worry! Crypto deposits depend on blockchain confirmations. Depending on the network (like Bitcoin or Ethereum), it can take anywhere from 5 to 30 minutes. You can track your transaction on any block explorer using your TXID. If it's been over an hour, our support team is happy to help."
  }
];

export default function FAQPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
            <section className="faq-page-shell">
              <div className="faq-page-bg" />
              <div className="faq-page-content">
                <div className="faq-header">
                  <span className="faq-badge">Help Center</span>
                  <h1>Got Questions? We Got Answers.</h1>
                  <p>Everything you need to know about KRABETS, simplified.</p>
                </div>

                <div className="faq-grid">
                  {FAQ_DATA.map((item, index) => (
                    <div 
                      key={index} 
                      className={`faq-card ${activeIndex === index ? 'is-active' : ''}`}
                      onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                    >
                      <div className="faq-card__question">
                        <span>{item.question}</span>
                        <i className={`fa-solid ${activeIndex === index ? 'fa-minus' : 'fa-plus'}`} />
                      </div>
                      <div className="faq-card__answer">
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="faq-footer">
                  <h3>Still confused?</h3>
                  <p>Our live chat is open 24/7. We usually reply in under 2 minutes.</p>
                  <Link href="/dashboard/chat" className="faq-btn">
                    <i className="fa-solid fa-comments" />
                    Talk to Us
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
