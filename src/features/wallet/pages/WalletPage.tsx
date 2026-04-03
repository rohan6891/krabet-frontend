"use client";

import { useMemo, useState } from "react";
import "@/features/dashboard/pages/DashboardPage.css";
import "./WalletPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { useWalletPageData } from "@/features/wallet/hooks/useWalletPageData";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import type { WalletDepositCheckoutData, WalletTransaction } from "@/features/wallet/types/wallet.types";
import type { CurrencyDropdownOption } from "@/features/wallet/hooks/useWalletPageData";

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

function buildQrUrl(value: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;
}

export function WalletPage() {
  const { showToast } = useToast();
  const {
    isChecking,
    isAuthenticated,
    loading,
    submittingDeposit,
    submittingWithdraw,
    transactions,
    profile,
    totalBalance,
    stats,
    availableCurrencies,
    currencyDropdownOptions,
    submitDeposit,
    submitWithdraw,
  } = useWalletPageData();

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // ─── Deposit state ───
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedCurrencyKey, setSelectedCurrencyKey] = useState("");
  const [depositCheckout, setDepositCheckout] = useState<WalletDepositCheckoutData | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ─── Withdraw state ───
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("Bank");
  const [withdrawDestination, setWithdrawDestination] = useState("");

  const transactionsList = useMemo(() => transactions.slice(0, 8), [transactions]);

  // Find the selected currency option
  const selectedOption: CurrencyDropdownOption | null = useMemo(() => {
    if (!selectedCurrencyKey && currencyDropdownOptions.length) {
      return currencyDropdownOptions[0];
    }
    return currencyDropdownOptions.find((opt) => opt.key === selectedCurrencyKey) ?? null;
  }, [selectedCurrencyKey, currencyDropdownOptions]);

  // Auto-select best default when options load
  const effectiveKey = selectedOption?.key ?? "";

  const openDeposit = () => {
    setDepositAmount("");
    setDepositCheckout(null);
    setDropdownOpen(false);
    // Pick the first option as default
    if (currencyDropdownOptions.length) {
      setSelectedCurrencyKey(currencyDropdownOptions[0].key);
    }
    setShowDeposit(true);
  };

  const openWithdraw = () => {
    setWithdrawMethod("Bank");
    setWithdrawAmount("");
    setWithdrawDestination("");
    setShowWithdraw(true);
  };

  const handleCurrencySelect = (option: CurrencyDropdownOption) => {
    setSelectedCurrencyKey(option.key);
    setDropdownOpen(false);
    // Reset checkout when currency changes
    setDepositCheckout(null);
  };

  const handleDepositSubmit = async () => {
    if (!selectedOption) {
      showToast({ type: "error", title: "Deposit", message: "Select a currency first." });
      return;
    }
    if (!depositAmount || Number(depositAmount) <= 0) {
      showToast({ type: "error", title: "Deposit", message: "Enter a valid amount." });
      return;
    }

    const minDep = Number(selectedOption.minDeposit);
    if (minDep > 0 && Number(depositAmount) < minDep) {
      showToast({
        type: "error",
        title: "Deposit",
        message: `Minimum deposit is ${selectedOption.minDeposit} ${selectedOption.code}.`,
      });
      return;
    }

    try {
      const checkout = await submitDeposit({
        amount: depositAmount,
        currency: selectedOption.code,
        network: selectedOption.network !== selectedOption.code ? selectedOption.network : undefined,
      });

      setDepositCheckout(checkout);
      showToast({ type: "success", title: "Deposit", message: "Deposit address generated." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create deposit.";
      showToast({ type: "error", title: "Deposit", message });
    }
  };

  const copyDepositAddress = async () => {
    if (!depositCheckout?.address) return;

    try {
      await navigator.clipboard.writeText(depositCheckout.address);
      showToast({ type: "success", title: "Copied", message: "Address copied to clipboard." });
    } catch {
      showToast({ type: "error", title: "Deposit", message: "Failed to copy address." });
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
      const currencyOptions = availableCurrencies.length ? availableCurrencies : ["USDT"];
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

            {/* ═══════════════════════════════════════════════════════════ */}
            {/*  STAKE-STYLE DEPOSIT MODAL                                */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {showDeposit && (
              <div className="wallet-modal-overlay" onClick={() => setShowDeposit(false)}>
                <div className="deposit-card" onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="deposit-card-header">
                    <div className="deposit-card-header-left">
                      <i className="fa-solid fa-wallet"></i>
                      <span>Deposit</span>
                    </div>
                    <button
                      type="button"
                      className="deposit-card-close"
                      onClick={() => setShowDeposit(false)}
                      aria-label="Close"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>

                  <div className="deposit-card-body">
                    {/* Currency Selection */}
                    <div className="deposit-field">
                      <label className="deposit-field-label">Currency</label>
                      <div className="deposit-dropdown-container">
                        <button
                          type="button"
                          className={`deposit-dropdown-trigger ${dropdownOpen ? "open" : ""}`}
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                          {selectedOption ? (
                            <div className="deposit-dropdown-selected">
                              <div className="deposit-coin-icon">
                                <span className="deposit-coin-symbol">{selectedOption.code.charAt(0)}</span>
                              </div>
                              <div className="deposit-dropdown-selected-info">
                                <span className="deposit-dropdown-coin-name">{selectedOption.label}</span>
                                {selectedOption.badge && (
                                  <span className={`deposit-badge ${selectedOption.badge.includes("High") ? "badge-warn" : "badge-good"}`}>
                                    {selectedOption.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="deposit-dropdown-placeholder">Select currency</span>
                          )}
                          <i className={`fa-solid fa-chevron-${dropdownOpen ? "up" : "down"} deposit-dropdown-arrow`}></i>
                        </button>

                        {dropdownOpen && (
                          <div className="deposit-dropdown-menu">
                            {currencyDropdownOptions.length === 0 && (
                              <div className="deposit-dropdown-empty">No currencies available</div>
                            )}
                            {currencyDropdownOptions.map((opt) => (
                              <button
                                key={opt.key}
                                type="button"
                                className={`deposit-dropdown-option ${opt.key === effectiveKey ? "selected" : ""}`}
                                onClick={() => handleCurrencySelect(opt)}
                              >
                                <div className="deposit-coin-icon">
                                  <span className="deposit-coin-symbol">{opt.code.charAt(0)}</span>
                                </div>
                                <div className="deposit-dropdown-option-info">
                                  <span className="deposit-dropdown-option-name">{opt.label}</span>
                                  {opt.badge && (
                                    <span className={`deposit-badge deposit-badge-sm ${opt.badge.includes("High") ? "badge-warn" : "badge-good"}`}>
                                      {opt.badge}
                                    </span>
                                  )}
                                </div>
                                {opt.key === effectiveKey && (
                                  <i className="fa-solid fa-check deposit-dropdown-check"></i>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="deposit-field">
                      <label className="deposit-field-label">Amount</label>
                      <div className="deposit-amount-wrap">
                        <input
                          id="deposit-amount-input"
                          type="number"
                          className="deposit-amount-input"
                          placeholder="0.00"
                          min="0"
                          step="any"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                        {selectedOption && (
                          <span className="deposit-amount-currency">{selectedOption.code}</span>
                        )}
                      </div>
                      {selectedOption && Number(selectedOption.minDeposit) > 0 && (
                        <span className="deposit-min-hint">
                          Min: {selectedOption.minDeposit} {selectedOption.code}
                        </span>
                      )}
                    </div>

                    {/* Generate Button */}
                    {!depositCheckout && (
                      <button
                        type="button"
                        className="deposit-generate-btn"
                        onClick={handleDepositSubmit}
                        disabled={submittingDeposit || !selectedOption}
                      >
                        {submittingDeposit ? (
                          <>
                            <span className="deposit-spinner"></span>
                            Generating...
                          </>
                        ) : (
                          "Generate Deposit Address"
                        )}
                      </button>
                    )}

                    {/* ─── Address + QR Result ─── */}
                    {depositCheckout && (depositCheckout.address || depositCheckout.qrPayload) && (
                      <div className="deposit-result">
                        {/* Address */}
                        <div className="deposit-field">
                          <label className="deposit-field-label">Address</label>
                          <div className="deposit-address-row">
                            <input
                              type="text"
                              className="deposit-address-input"
                              readOnly
                              value={depositCheckout.address || "Address not available"}
                            />
                            <button
                              type="button"
                              className="deposit-copy-btn"
                              onClick={copyDepositAddress}
                              disabled={!depositCheckout.address}
                              title="Copy address"
                            >
                              <i className="fa-regular fa-copy"></i>
                            </button>
                          </div>
                        </div>

                        {/* QR Code */}
                        <div className="deposit-qr-section">
                          <img
                            className="deposit-qr-img"
                            src={buildQrUrl(depositCheckout.qrPayload || depositCheckout.address)}
                            alt="Deposit QR code"
                          />
                        </div>

                        {/* Info Rows */}
                        <div className="deposit-info-grid">
                          <div className="deposit-info-row">
                            <span>Network</span>
                            <strong>{selectedOption?.network !== selectedOption?.code ? selectedOption?.network : selectedOption?.code}</strong>
                          </div>
                          <div className="deposit-info-row">
                            <span>Amount</span>
                            <strong>{depositCheckout.amount || depositAmount} {depositCheckout.currency}</strong>
                          </div>
                          <div className="deposit-info-row">
                            <span>Confirmations</span>
                            <strong>2 Confirmations</strong>
                          </div>
                        </div>

                        {/* Network Warning */}
                        <div className="deposit-warning">
                          <i className="fa-solid fa-triangle-exclamation"></i>
                          <p>
                            Send only <strong>{selectedOption?.code}</strong> via the{" "}
                            <strong>{selectedOption?.network !== selectedOption?.code ? selectedOption?.network : selectedOption?.code}</strong>{" "}
                            network to this address. Sending via a different network may result in{" "}
                            <strong>permanent loss of funds</strong>.
                          </p>
                        </div>

                        {/* Generate New */}
                        <button
                          type="button"
                          className="deposit-generate-btn deposit-generate-secondary"
                          onClick={handleDepositSubmit}
                          disabled={submittingDeposit}
                        >
                          {submittingDeposit ? "Generating..." : "Generate New Address"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/*  WITHDRAW MODAL (unchanged)                               */}
            {/* ═══════════════════════════════════════════════════════════ */}
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
