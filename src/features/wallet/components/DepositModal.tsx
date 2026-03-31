import { useState, useMemo } from "react";
import type { WalletDepositCheckoutData } from "@/features/wallet/types/wallet.types";
import type { CurrencyDropdownOption } from "@/features/wallet/hooks/useWalletPageData";

interface DepositModalProps {
  onClose: () => void;
  currencyDropdownOptions: CurrencyDropdownOption[];
  submitDeposit: (payload: {
    amount: string;
    currency: string;
    network?: string;
  }) => Promise<WalletDepositCheckoutData>;
  submittingDeposit: boolean;
  showToast: (args: { type: "success" | "error"; title: string; message: string }) => void;
}

export function DepositModal({
  onClose,
  currencyDropdownOptions,
  submitDeposit,
  submittingDeposit,
  showToast,
}: DepositModalProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedCurrencyKey, setSelectedCurrencyKey] = useState(
    currencyDropdownOptions.length ? currencyDropdownOptions[0].key : ""
  );
  const [depositCheckout, setDepositCheckout] = useState<WalletDepositCheckoutData | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Find the selected currency option
  const selectedOption: CurrencyDropdownOption | null = useMemo(() => {
    if (!selectedCurrencyKey && currencyDropdownOptions.length) {
      return currencyDropdownOptions[0];
    }
    return currencyDropdownOptions.find((opt) => opt.key === selectedCurrencyKey) ?? null;
  }, [selectedCurrencyKey, currencyDropdownOptions]);

  const effectiveKey = selectedOption?.key ?? "";

  const handleCurrencySelect = (option: CurrencyDropdownOption) => {
    setSelectedCurrencyKey(option.key);
    setDropdownOpen(false);
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

  function buildQrUrl(value: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;
  }

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      {/* We apply the wallet-modal class to make the Deposit card match the site's purple theme */}
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()} style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 48px)' }}>
        <div className="wallet-modal-title" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-arrow-up-from-bracket"></i>
            <span>Deposit</span>
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
          {/* Currency Selection */}
          <div className="wallet-field font-inter">
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
          <div className="wallet-field font-inter">
            <label className="deposit-field-label">Amount</label>
            <div className="deposit-amount-wrap">
              <input
                id="deposit-amount-input"
                type="number"
                className="deposit-amount-input wallet-field-input"
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
              style={{ marginTop: '10px', fontSize: '15px' }}
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
              <div className="wallet-field font-inter">
                <label className="deposit-field-label">Address</label>
                <div className="deposit-address-row">
                  <input
                    type="text"
                    className="deposit-address-input wallet-field-input"
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
              <div className="deposit-info-grid theme-matching">
                <div className="deposit-info-row">
                  <span>Network</span>
                  <strong>{selectedOption?.network !== selectedOption?.code ? selectedOption?.network : selectedOption?.code}</strong>
                </div>
                <div className="deposit-info-row">
                  <span>Amount</span>
                  <strong>{depositCheckout.amount || depositAmount} {depositCheckout.currency}</strong>
                </div>
                {/* Explain the confirmations */}
                <div className="deposit-info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>Confirmations</span>
                    <strong>2 Confirmations</strong>
                  </div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', lineHeight: '1.4' }}>
                    Confirmations represent the number of blocks added to the blockchain since your transaction.
                    Tokens will be credited to your account once 2 confirmations are reached to ensure the transfer is securely validated and irreversible.
                  </span>
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
  );
}
