"use client";

import { useState, useMemo } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { WalletTransaction } from "@/features/wallet/types/wallet.types";

interface TransactionsModalProps {
  onClose: () => void;
  transactions: WalletTransaction[];
}

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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toPickerValue(value: string): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
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

export function TransactionsModal({ onClose, transactions }: TransactionsModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [methodFilter, setMethodFilter] = useState<"All" | "Game" | "Crypto">("All");

  const recordsPerPage = 15;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filter by Date
      const txDate = new Date(tx.created_at);
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (txDate < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (txDate > to) return false;
      }

      // Filter by Method
      if (methodFilter !== "All") {
        const { method } = buildTxView(tx);
        if (method !== methodFilter) return false;
      }

      return true;
    });
  }, [transactions, fromDate, toDate, methodFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / recordsPerPage) || 1;
  const currentTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredTransactions, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setMethodFilter("All");
    setCurrentPage(1);
  };

  // Reset page to 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, methodFilter]);

  const pickerBackground = "linear-gradient(180deg, rgba(71, 18, 117, 0.466), rgba(37, 9, 71, 0.849)), rgba(13, 4, 24, 0.884)";
  const pickerBorder = "1px solid rgba(199, 132, 255, 0.35)";
  const pickerShadow = "inset 0 1px 0 rgba(59, 24, 104, 0.795)";

  const datePickerSx = {
    width: "100%",
    "& .MuiOutlinedInput-root": {
      color: "#f6ecff",
      borderRadius: "12px",
      height: "42px", 
      background: pickerBackground,
      boxShadow: pickerShadow,
      border: pickerBorder,
      fontSize: "13px",
      transition: "all 0.2s ease",
      "& fieldset": { border: "none" },
      "&:hover": {
        borderColor: "rgba(199, 132, 255, 0.6)",
      },
      "&.Mui-focused": {
        borderColor: "#b770ff",
        boxShadow: "0 0 0 3px rgba(177, 88, 255, 0.25)",
      },
      "& .MuiInputAdornment-root .MuiIconButton-root": {
        color: "#cf8cff",
        padding: "6px",
      },
      "& .MuiOutlinedInput-input": {
        padding: "0 14px",
        "&::placeholder": {
          color: "rgba(246, 236, 255, 0.4)",
          opacity: 1,
        }
      }
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="wallet-modal-overlay" onClick={onClose} style={{ 
        position: 'fixed', 
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', 
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '100px 16px 40px'
      }}>
        <div className="wallet-modal" onClick={(e) => e.stopPropagation()} style={{ 
          width: '100%', 
          maxWidth: '960px', 
          maxHeight: 'calc(100vh - 140px)', 
          display: 'flex', 
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #1e0b2e 0%, #11051b 100%)',
          border: '1px solid rgba(183, 112, 255, 0.3)',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div className="wallet-modal-title" style={{ 
            display: 'flex',
            justifyContent: 'space-between', 
            padding: '16px 24px',
            background: 'linear-gradient(180deg, rgba(142, 76, 229, 0.15), transparent)',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(142, 76, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-history" style={{ color: '#d7b5ff', fontSize: '16px' }}></i>
              </div>
              <span style={{ fontSize: '17px', fontWeight: '700', color: '#fff' }}>Transaction History</span>
            </div>
            <button type="button" className="deposit-card-close" onClick={onClose} aria-label="Close" style={{
              width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="deposit-card-body" style={{ 
            flex: 1, 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '20px 24px',
            gap: '20px' 
          }}>
            {/* Unified Filters Row */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              gap: '12px',
              background: 'rgba(255,255,255,0.02)', 
              padding: '16px', 
              borderRadius: '16px', 
              border: '1px solid rgba(255,255,255,0.05)' 
            }}>
              {/* From Picker */}
              <div style={{ flex: '1 1 160px', minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f2deff', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <i className="fa-solid fa-calendar-day" style={{ color: '#cf8cff', marginRight: '6px' }}></i>
                  From Date
                </label>
                <DatePicker
                  value={toPickerValue(fromDate)}
                  onChange={(val) => setFromDate(val ? val.format("YYYY-MM-DD") : "")}
                  format="DD/MM/YYYY"
                  sx={datePickerSx}
                  slotProps={{
                    popper: { className: "settings-picker-popper" },
                  }}
                />
              </div>

              {/* To Picker */}
              <div style={{ flex: '1 1 160px', minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f2deff', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <i className="fa-solid fa-calendar-day" style={{ color: '#cf8cff', marginRight: '6px' }}></i>
                  To Date
                </label>
                <DatePicker
                  value={toPickerValue(toDate)}
                  onChange={(val) => setToDate(val ? val.format("YYYY-MM-DD") : "")}
                  format="DD/MM/YYYY"
                  sx={datePickerSx}
                  slotProps={{
                    popper: { className: "settings-picker-popper" },
                  }}
                />
              </div>

              {/* Method Toggle */}
              <div style={{ flex: '1.2 1 240px', minWidth: '220px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f2deff', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <i className="fa-solid fa-filter" style={{ color: '#cf8cff', marginRight: '6px' }}></i>
                  Method
                </label>
                <div style={{ display: 'flex', background: pickerBackground, border: pickerBorder, boxShadow: pickerShadow, padding: '4px', borderRadius: '12px' }}>
                  {(["All", "Game", "Crypto"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethodFilter(m)}
                      style={{
                        flex: 1,
                        height: '32px',
                        border: 'none',
                        borderRadius: '8px',
                        background: methodFilter === m ? 'linear-gradient(180deg, #8439b9, #460aa7)' : 'transparent',
                        color: '#fff',
                        opacity: methodFilter === m ? 1 : 0.6,
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: methodFilter === m ? '0 4px 12px rgba(132, 57, 185, 0.3)' : 'none'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.6)',
                  padding: '0 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <i className="fa-solid fa-rotate-left"></i>
                Clear
              </button>
            </div>

            {/* Table Container */}
            <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', borderRadius: '16px' }}>
              <table className="transactions-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Amount</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Method</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <i className="fa-solid fa-inbox" style={{ fontSize: '32px', color: 'rgba(255,255,255,0.1)' }}></i>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No transactions found.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentTransactions.map((tx) => {
                      const view = buildTxView(tx);
                      return (
                        <tr key={tx.id} style={{ transition: 'background 0.2s' }}>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <span className={`tx-type ${view.className}`} style={{ fontSize: '13px', fontWeight: '700' }}>
                              <i className={view.icon} style={{ fontSize: '14px' }}></i>
                              {view.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <span style={{ 
                              fontSize: '14px', 
                              fontWeight: '800', 
                              color: view.className === 'tx-deposit' ? '#59d58e' : '#fff'
                            }}>
                              {view.className === "tx-deposit" ? "+" : "-"}${formatCurrency(tx.amount)}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{view.method}</span>
                          </td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{formatDate(tx.created_at)}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer / Pagination */}
          <div style={{ 
            padding: '16px 24px', 
            background: 'rgba(0,0,0,0.2)', 
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {totalPages > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === 1 ? 'rgba(255,255,255,0.03)' : 'rgba(142, 76, 229, 0.15)',
                    color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                    border: '1px solid rgba(142, 76, 229, 0.1)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className="fa-solid fa-angle-left" style={{ marginRight: '6px' }}></i>
                  Prev
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Page</span>
                  <span style={{ color: '#fff', fontWeight: '800', fontSize: '15px' }}>{currentPage}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>/ {totalPages}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(142, 76, 229, 0.15)',
                    color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : '#fff',
                    border: '1px solid rgba(142, 76, 229, 0.1)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Next
                  <i className="fa-solid fa-angle-right" style={{ marginLeft: '6px' }}></i>
                </button>
              </>
            ) : (
              <div style={{ width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
}
