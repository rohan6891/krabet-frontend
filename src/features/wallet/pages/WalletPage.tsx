"use client";

import { useMemo, useState } from "react";
import "@/features/dashboard/pages/DashboardPage.css";
import "./WalletPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
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
    loading,
    submittingDeposit,
    submittingWithdraw,
    transactions,
    profile,
    totalBalance,
    stats,
    availableCurrencies,
    submitDeposit,
    submitWithdraw,
  } = useWalletPageData();

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("Crypto");
  const [depositDetails, setDepositDetails] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("Bank");
  const [withdrawDestination, setWithdrawDestination] = useState("");

  const transactionsList = useMemo(() => transactions.slice(0, 8), [transactions]);
  const currencyOptions = availableCurrencies.length ? availableCurrencies : ["USDT"];

  const openDeposit = () => {
    setDepositMethod("Crypto");
    setDepositAmount("");
    setDepositDetails("");
    setShowDeposit(true);
  };

  const openWithdraw = () => {
    setWithdrawMethod("Bank");
    setWithdrawAmount("");
    setWithdrawDestination("");
    setShowWithdraw(true);
  };

  const handleDepositSubmit = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) {
      showToast({ type: "error", title: "Deposit", message: "Enter a valid amount." });
      return;
    }

    try {
      await submitDeposit({
        amount: depositAmount,
        currency: currencyOptions[0],
        network: depositDetails.trim() || undefined,
      });

      showToast({ type: "success", title: "Deposit", message: "Deposit request created successfully." });
      setShowDeposit(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create deposit request.";
      showToast({ type: "error", title: "Deposit", message });
    }
  };

  const handleWithdrawSubmit = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      showToast({ type: "error", title: "Withdraw", message: "Enter a valid amount." });
      return;
    }

    if (!withdrawDestination.trim()) {
      showToast({ type: "error", title: "Withdraw", message: "Destination details are required." });
      return;
    }

    try {
      await submitWithdraw({
        amount: withdrawAmount,
        currency: currencyOptions[0],
        withdrawalAddress: withdrawDestination.trim(),
      });

      showToast({ type: "success", title: "Withdraw", message: "Withdrawal request submitted." });
      setShowWithdraw(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit withdrawal request.";
      showToast({ type: "error", title: "Withdraw", message });
    }
  };

  if (isChecking) {
    return <div className="dashboard-auth-loading" aria-hidden="true"></div>;
  }

  return (
    <div className="krabet-page">
      <div className="krabet-shell">
        <DashboardSidebar logoSrc="/KRABETS-LOGO.png" />

        <main className="krabet-main">
          <DashboardHeader
            walletBalance={formatCurrency(totalBalance)}
            username={profile.username}
            avatarUrl={profile.avatarUrl}
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

                    <button type="button" className="view-all-btn" disabled={loading}>
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
              <div className="wallet-modal-overlay" onClick={() => setShowDeposit(false)}>
                <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="wallet-modal-title">
                    <i className="fa-solid fa-circle-down"></i>
                    <span>Deposit Funds</span>
                  </div>

                  <div className="wallet-form-grid">
                    <div className="wallet-field">
                      <label>Amount</label>
                      <input type="text" placeholder="Enter amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                    </div>

                    <div className="wallet-field">
                      <label>Payment Method</label>
                      <select value={depositMethod} onChange={(e) => setDepositMethod(e.target.value)}>
                        <option value="Crypto">Crypto</option>
                        <option value="Card">Card</option>
                        <option value="Bank">Bank</option>
                      </select>
                    </div>

                    <div className="wallet-field full-width">
                      <label>Wallet Address / Payment Details</label>
                      <input
                        type="text"
                        placeholder="Enter wallet address or payment details"
                        value={depositDetails}
                        onChange={(e) => setDepositDetails(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="wallet-modal-actions">
                    <button type="button" className="modal-confirm-btn" onClick={handleDepositSubmit} disabled={submittingDeposit}>
                      Confirm Deposit
                    </button>
                    <button type="button" className="modal-cancel-btn" onClick={() => setShowDeposit(false)} disabled={submittingDeposit}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showWithdraw && (
              <div className="wallet-modal-overlay" onClick={() => setShowWithdraw(false)}>
                <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="wallet-modal-title">
                    <i className="fa-solid fa-circle-up"></i>
                    <span>Withdraw Funds</span>
                  </div>

                  <div className="wallet-form-grid">
                    <div className="wallet-field">
                      <label>Amount</label>
                      <input type="text" placeholder="Enter amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                    </div>

                    <div className="wallet-field">
                      <label>Withdrawal Method</label>
                      <select value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)}>
                        <option value="Bank">Bank</option>
                        <option value="Crypto">Crypto</option>
                      </select>
                    </div>

                    <div className="wallet-field full-width">
                      <label>Destination Details</label>
                      <input
                        type="text"
                        placeholder="Enter destination details"
                        value={withdrawDestination}
                        onChange={(e) => setWithdrawDestination(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="wallet-modal-actions">
                    <button type="button" className="modal-confirm-btn" onClick={handleWithdrawSubmit} disabled={submittingWithdraw}>
                      Confirm Withdrawal
                    </button>
                    <button type="button" className="modal-cancel-btn" onClick={() => setShowWithdraw(false)} disabled={submittingWithdraw}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
