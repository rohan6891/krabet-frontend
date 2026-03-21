import { useState, useEffect } from "react";

export interface WalletData {
  id: string;
  currency: string;
  balance: string;
  lockedBalance: string;
  availableBalance: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: string;
  [key: string]: unknown;
}

export function useWallet() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [totalBalance, setTotalBalance] = useState<string>("0.00");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem("krabets_session");
    if (!raw) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    
    let token = "";
    try {
      const session = JSON.parse(raw);
      token = session.token || window.localStorage.getItem("accessToken");
    } catch {
      token = window.localStorage.getItem("accessToken") || "";
    }

    if (!token) {
      setLoading(false);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

    const fetchWallet = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/v1/wallet/balance`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success && data.data && data.data.wallets) {
          setWallets(data.data.wallets);
          const usdWallet = data.data.wallets.find((w: WalletData) => w.currency === 'USD' || w.currency === 'USDT') || data.data.wallets[0];
          if (usdWallet) {
             setTotalBalance(usdWallet.availableBalance);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchTransactions = async () => {
      try {
         const res = await fetch(`${baseUrl}/api/v1/wallet/transactions`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success && data.data && data.data.transactions) {
           setTransactions(data.data.transactions);
        }
      } catch(err) {
         console.error(err);
      }
    };

    Promise.all([fetchWallet(), fetchTransactions()]).finally(() => {
      setLoading(false);
    });

  }, []);

  return { wallets, totalBalance, transactions, loading };
}
