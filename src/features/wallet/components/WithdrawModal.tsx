import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { WalletEntry } from "@/features/wallet/types/wallet.types";
import type { CurrencyDropdownOption } from "@/features/wallet/hooks/useWalletPageData";

interface WithdrawModalProps {
  onClose: () => void;
  wallets: WalletEntry[];
  currencyDropdownOptions: CurrencyDropdownOption[];
  submitWithdraw: (payload: {
    amount: string;
    currency: string;
    withdrawalAddress: string;
    network?: string;
    twoFactorCode?: string;
  }) => Promise<void>;
  submittingWithdraw: boolean;
  twoFactorEnabled: boolean;
  showToast: (args: { type: "success" | "error"; title: string; message: string }) => void;
}

export function WithdrawModal({
  onClose,
  wallets,
  currencyDropdownOptions,
  submitWithdraw,
  submittingWithdraw,
  twoFactorEnabled,
  showToast,
}: WithdrawModalProps) {
  const router = useRouter();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDestination, setWithdrawDestination] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [show2FAPopup, setShow2FAPopup] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Only show assets that are withdraw-enabled.
  const withdrawableOptions = useMemo(
    () => currencyDropdownOptions.filter((opt) => opt.withdrawEnabled),
    [currencyDropdownOptions]
  );

  const [selectedCurrencyKey, setSelectedCurrencyKey] = useState(
    withdrawableOptions.length ? withdrawableOptions[0].key : ""
  );

  const selectedOption: CurrencyDropdownOption | null = useMemo(() => {
    if (!selectedCurrencyKey && withdrawableOptions.length) {
      return withdrawableOptions[0];
    }
    return withdrawableOptions.find((opt) => opt.key === selectedCurrencyKey) ?? null;
  }, [selectedCurrencyKey, withdrawableOptions]);

  const effectiveKey = selectedOption?.key ?? "";
  const selectedNetwork = selectedOption?.network ?? "";

  const selectedWallet = useMemo(() => {
    if (!selectedOption) return null;
    return wallets.find((w) => w.currency === selectedOption.code) ?? null;
  }, [selectedOption, wallets]);

  const handleCurrencySelect = (option: CurrencyDropdownOption) => {
    setSelectedCurrencyKey(option.key);
    setDropdownOpen(false);
    setWithdrawAmount("");
  };

  const handleMaxClick = () => {
    if (selectedWallet && Number(selectedWallet.availableBalance) > 0) {
      setWithdrawAmount(selectedWallet.availableBalance);
    }
  };

  const executeWithdrawal = async () => {
    try {
      await submitWithdraw({
        amount: withdrawAmount,
        currency: selectedOption!.code,
        withdrawalAddress: withdrawDestination.trim(),
        network: selectedOption!.network,
        twoFactorCode: twoFactorEnabled ? twoFactorCode.trim() : undefined,
      });

      showToast({ type: "success", title: "Withdraw", message: "Withdrawal request submitted." });
      setShow2FAPopup(false);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit withdrawal request.";
      showToast({ type: "error", title: "Withdraw", message });
    }
  };

  const handleWithdrawSubmit = () => {
    if (!selectedOption) {
      showToast({ type: "error", title: "Withdraw", message: "Select a currency first." });
      return;
    }
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      showToast({ type: "error", title: "Withdraw", message: "Enter a valid amount." });
      return;
    }
    if (!withdrawDestination.trim()) {
      showToast({ type: "error", title: "Withdraw", message: "Address is required." });
      return;
    }

    const minWd = Number(selectedOption.minWithdrawal);
    if (minWd > 0 && Number(withdrawAmount) < minWd) {
      showToast({
        type: "error",
        title: "Withdraw",
        message: `Minimum withdrawal is ${selectedOption.minWithdrawal} ${selectedOption.code}.`,
      });
      return;
    }

    if (twoFactorEnabled) {
      setShow2FAPopup(true);
    } else {
      executeWithdrawal();
    }
  };

  const copyFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setWithdrawDestination(text);
    } catch {
      showToast({ type: "error", title: "Clipboard", message: "Failed to read clipboard." });
    }
  };

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()} style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 48px)' }}>
        <div className="wallet-modal-title" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
            <span>Withdraw</span>
          </div>
          <button
            type="button"
            className="deposit-card-close"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="deposit-card-body">
          {/* Currency Dropdown (Reuses Deposit styles) */}
          <div className="wallet-field font-inter">
            <label className="deposit-field-label">Currency</label>
            <div className="deposit-dropdown-container">
              <button
                type="button"
                className={`deposit-dropdown-trigger ${dropdownOpen ? "open" : ""}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {selectedOption ? (
                  <div className="deposit-dropdown-selected" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="deposit-coin-icon">
                        <span className="deposit-coin-symbol">{selectedOption.code.charAt(0)}</span>
                      </div>
                      <div className="deposit-dropdown-selected-info" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                        <span className="deposit-dropdown-coin-name">{selectedOption.code}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{selectedOption.label}</span>
                      </div>
                    </div>
                    {/* Fake USD equivalent for layout similarity, or real available balance */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>
                        {selectedWallet ? Number(selectedWallet.availableBalance).toFixed(8) : "0.00000000"}
                      </span>
                      {selectedOption.badge && (
                        <span className={`deposit-badge ${selectedOption.badge.includes("High") ? "badge-warn" : "badge-good"}`} style={{ height: '18px', fontSize: '10px' }}>
                          {selectedOption.badge}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="deposit-dropdown-placeholder">Select currency</span>
                )}
                <i className={`fa-solid fa-chevron-${dropdownOpen ? "up" : "down"} deposit-dropdown-arrow`} style={{ marginLeft: '8px' }}></i>
              </button>

              {dropdownOpen && (
                <div className="deposit-dropdown-menu">
                  {withdrawableOptions.length === 0 && (
                    <div className="deposit-dropdown-empty">No currencies available</div>
                  )}
                  {withdrawableOptions.map((opt) => {
                    const w = wallets.find((w) => w.currency === opt.code);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        className={`deposit-dropdown-option ${opt.key === effectiveKey ? "selected" : ""}`}
                        onClick={() => handleCurrencySelect(opt)}
                      >
                        <div className="deposit-coin-icon">
                          <span className="deposit-coin-symbol">{opt.code.charAt(0)}</span>
                        </div>
                        <div className="deposit-dropdown-option-info" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className="deposit-dropdown-option-name">{opt.code}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{opt.label}</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>
                            {w ? Number(w.availableBalance).toFixed(8) : "0.00000000"}
                          </span>
                        </div>
                        {opt.key === effectiveKey && (
                          <i className="fa-solid fa-check deposit-dropdown-check"></i>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Amount Input with Max Button */}
          <div className="wallet-field font-inter">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="deposit-field-label">Amount <span style={{ color: '#ef4444' }}>*</span></label>
              {selectedOption && selectedWallet && (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {Number(selectedWallet.availableBalance).toFixed(8)} {selectedOption.code}
                </span>
              )}
            </div>
            <div className="deposit-amount-wrap" style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="number"
                  className="deposit-amount-input wallet-field-input"
                  style={{ paddingRight: '46px' }}
                  placeholder="0.00"
                  min="0"
                  step="any"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
                {selectedOption && (
                  <span className="deposit-amount-currency" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #8654ff, #5b2db4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#fff' }}>{selectedOption.code.charAt(0)}</span>
                    </div>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleMaxClick}
                style={{
                  width: '60px',
                  height: '44px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(188, 129, 255, 0.18)',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              >
                Max
              </button>
            </div>
          </div>

          {/* Address Input */}
          <div className="wallet-field font-inter">
            <label className="deposit-field-label">
              Destination Address ({selectedNetwork || "Network"}) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="deposit-address-row">
              <input
                type="text"
                className="deposit-address-input wallet-field-input"
                placeholder={selectedNetwork ? `Enter ${selectedNetwork} address` : "Enter destination address"}
                value={withdrawDestination}
                onChange={(e) => setWithdrawDestination(e.target.value)}
              />
              <button
                type="button"
                className="deposit-copy-btn"
                onClick={copyFromClipboard}
                title="Paste from clipboard"
              >
                <i className="fa-solid fa-clipboard"></i>
              </button>
            </div>
          </div>

          {/* Fees Row */}
          {selectedOption && (
            <div className="deposit-info-grid theme-matching" style={{ border: 'none', background: 'transparent' }}>
              <div className="deposit-info-row" style={{ background: 'transparent', padding: '4px 0', border: 'none' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Minimum Withdrawal</span>
                <strong style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selectedOption.minWithdrawal} {selectedOption.code}
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'linear-gradient(135deg, #8654ff, #5b2db4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#fff' }}>{selectedOption.code.charAt(0)}</span>
                  </div>
                </strong>
              </div>
              <div className="deposit-info-row" style={{ background: 'transparent', padding: '4px 0', border: 'none' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>Transaction Fee</span>
                <strong style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selectedOption.withdrawalFee || "0.00"} {selectedOption.code}
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'linear-gradient(135deg, #8654ff, #5b2db4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#fff' }}>{selectedOption.code.charAt(0)}</span>
                  </div>
                </strong>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="button"
            className="deposit-generate-btn"
            onClick={handleWithdrawSubmit}
            disabled={submittingWithdraw || !selectedOption}
            style={{ marginTop: '10px', height: '48px', fontSize: '15px' }}
          >
            {submittingWithdraw ? (
              <>
                <span className="deposit-spinner"></span>
                Processing...
              </>
            ) : "Withdraw"}
          </button>

          {/* 2FA Enable Section Only if Not Enabled */}
          {!twoFactorEnabled && (
            <div style={{ marginTop: '4px', borderTop: '1px solid rgba(188, 129, 255, 0.18)', paddingTop: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(188, 129, 255, 0.1)' }}>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px', lineHeight: '1.4' }}>
                  Improve your account security with Two-Factor Authentication
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/settings')}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '10px 0',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    fontWeight: '600',
                    width: '100%',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                >
                  Enable 2FA
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 2FA Popup Overlay */}
      {show2FAPopup && (
        <div className="wallet-modal-overlay popup-overlay" style={{ zIndex: 1000, background: 'rgba(0,0,0,0.85)' }} onClick={() => setShow2FAPopup(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '380px', padding: '28px', background: '#1e293b' }}>
            <div className="wallet-modal-title" style={{ marginBottom: '16px', justifyContent: 'center' }}>
              <i className="fa-solid fa-shield-halved" style={{ fontSize: '24px', color: '#a855f7' }}></i>
            </div>
            <h3 style={{ textAlign: 'center', color: '#fff', fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>2-Step Verification</h3>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5' }}>
              Enter the 6-digit code from your authenticator app to confirm the withdrawal.
            </p>
            <input
              type="text"
              placeholder="000 000"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              maxLength={6}
              className="wallet-field-input"
              style={{
                height: '52px',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                marginBottom: '24px',
                fontWeight: '600'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setShow2FAPopup(false)}
                disabled={submittingWithdraw}
                style={{ flex: 1, height: '52px', fontSize: '15px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-confirm-btn"
                onClick={() => {
                  if (!twoFactorCode || twoFactorCode.length < 6) {
                    showToast({ type: "error", title: "2FA", message: "Enter a valid 6-digit code." });
                    return;
                  }
                  executeWithdrawal();
                }}
                disabled={submittingWithdraw}
                style={{ flex: 1, height: '52px', fontSize: '15px' }}
              >
                {submittingWithdraw ? "Verifying..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
