"use client";

import { useMemo, useState } from "react";
import "@/features/dashboard/pages/DashboardPage.css";
import "./WalletPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { DepositModal } from "@/features/wallet/components/DepositModal";
import { WithdrawModal } from "@/features/wallet/components/WithdrawModal";
import { TransactionsModal } from "@/features/wallet/components/TransactionsModal";
import { useWalletPageData } from "@/features/wallet/hooks/useWalletPageData";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import type { WalletTransaction } from "@/features/wallet/types/wallet.types";

function formatCurrency(value: string | number): string {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return safeValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildTxView(tx: WalletTransaction): { icon: string; className: string; label: string; method: string } {
  const isPositive = tx.type === "deposit" || tx.type === "win" || tx.type === "refund";

  const label = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
  const method = tx.reference_type.includes("bet") ? "Game" : "Crypto";

  return {
    icon: isPositive ? "fa-solid fa-circle-down" : "fa-solid fa-circle-up",
    className: isPositive ? "tx-deposit" : "tx-withdraw",
    label,
    method,
  };
}

export function WalletPage() {
  const { showToast } = useToast();
  const {
    isChecking,
    isAuthenticated,
    loading,
    submittingDeposit,
    submittingWithdraw,
    wallets,
    transactions,
    profile,
    totalBalance,
    stats,
    currencyDropdownOptions,
    submitDeposit,
    submitWithdraw,
  } = useWalletPageData();

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);

  const transactionsList = useMemo(() => transactions.slice(0, 8), [transactions]);

  const openDeposit = () => {
    setShowDeposit(true);
  };

  const openWithdraw = () => {
    setShowWithdraw(true);
  };

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
            walletBalance={formatCurrency(totalBalance)}
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
            <div className="wallet-page">
              <h1 className="wallet-title">
                Welcome to your Wallet <span id="username-wallet">{profile.username}</span>
              </h1>

              <section className="wallet-panel wallet-overview-panel">
                <div className="panel-heading">
                  <i className="fa-solid fa-chart-bar"></i>
                  <span>WALLET OVERVIEW</span>
                </div>

                <div className="balance-card">
                  <div className="balance-card-left">
                    <div className="balance-label">Total Balance</div>
                    <div className="balance-value">
                      <i className="fa-solid fa-wallet balance-main-icon"></i>
                      <span>${formatCurrency(totalBalance)}</span>
                    </div>
                  </div>
                </div>

                <div className="overview-stats-grid">
                  <div className="mini-stat-card">
                    <div className="mini-stat-icon">
                      <i className="fa-solid fa-circle-down"></i>
                    </div>
                    <div className="mini-stat-content">
                      <div className="mini-stat-label">Total Deposits</div>
                      <div className="mini-stat-value">${formatCurrency(stats.totalDeposits)}</div>
                    </div>
                  </div>

                  <div className="mini-stat-card">
                    <div className="mini-stat-icon">
                      <i className="fa-solid fa-circle-up"></i>
                    </div>
                    <div className="mini-stat-content">
                      <div className="mini-stat-label">Total Withdrawals</div>
                      <div className="mini-stat-value">${formatCurrency(stats.totalWithdrawals)}</div>
                    </div>
                  </div>

                  <div className="mini-stat-card">
                    <div className="mini-stat-icon">
                      <i className="fa-solid fa-dice"></i>
                    </div>
                    <div className="mini-stat-content">
                      <div className="mini-stat-label">Total Wagered</div>
                      <div className="mini-stat-value">${formatCurrency(stats.totalWagered)}</div>
                    </div>
                  </div>

                  <div className="mini-stat-card">
                    <div className="mini-stat-icon">
                      <i className="fa-solid fa-trophy"></i>
                    </div>
                    <div className="mini-stat-content">
                      <div className="mini-stat-label">Total Wins</div>
                      <div className="mini-stat-value">${formatCurrency(stats.totalWins)}</div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="wallet-lower-grid">
                <section className="wallet-panel transactions-panel">
                  <div className="panel-heading transactions-head">
                    <div className="panel-heading-left">
                      <i className="fa-solid fa-history"></i>
                      <span>RECENT TRANSACTIONS</span>
                    </div>

                    <button type="button" className="view-all-btn" disabled={loading} onClick={() => setShowTransactionsModal(true)}>
                      View All <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>

                  <div className="transactions-table-wrap">
                    <table className="transactions-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionsList.map((tx) => {
                          const view = buildTxView(tx);
                          return (
                            <tr key={tx.id}>
                              <td>
                                <span className={`tx-type ${view.className}`}>
                                  <i className={view.icon}></i>
                                  {view.label}
                                </span>
                              </td>
                              <td className="tx-amount">
                                {view.className === "tx-deposit" ? "+" : "-"}${formatCurrency(tx.amount)}
                              </td>
                              <td>{view.method}</td>
                              <td>{formatDate(tx.created_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="wallet-panel actions-panel">
                  <div className="panel-heading">
                    <i className="fa-solid fa-sack-dollar"></i>
                    <span>DEPOSIT / WITHDRAW</span>
                  </div>

                  <div className="action-buttons-row">
                    <button type="button" className="action-btn deposit-action" onClick={openDeposit} disabled={loading}>
                      <i className="fa-solid fa-arrow-up-from-bracket"></i>
                      <span>DEPOSIT</span>
                    </button>

                    <button type="button" className="action-btn withdraw-action" onClick={openWithdraw} disabled={loading}>
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>WITHDRAW</span>
                    </button>
                  </div>
                </section>
              </div>
            </div>

            {showDeposit && (
              <DepositModal
                onClose={() => setShowDeposit(false)}
                currencyDropdownOptions={currencyDropdownOptions}
                submitDeposit={submitDeposit}
                submittingDeposit={submittingDeposit}
                showToast={showToast}
              />
            )}

            {showWithdraw && (
              <WithdrawModal
                onClose={() => setShowWithdraw(false)}
                wallets={wallets}
                currencyDropdownOptions={currencyDropdownOptions}
                submitWithdraw={submitWithdraw}
                submittingWithdraw={submittingWithdraw}
                twoFactorEnabled={false}
                showToast={showToast}
              />
            )}

            {showTransactionsModal && (
              <TransactionsModal
                onClose={() => setShowTransactionsModal(false)}
                transactions={transactions}
              />
            )}
          </div>

          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}
