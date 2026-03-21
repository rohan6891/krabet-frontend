import React from "react";
import Link from "next/link";
import './Header.css';

import { useSession } from "@/shared/hooks/useSession";
import { useWallet } from "@/shared/hooks/useWallet";

export function Header() {
  const { user } = useSession();
  const { totalBalance } = useWallet();

  return (
    <header className="main-header">
      <div className="header-right">
        {user ? (
          <>
            <div className="user-info">
              <img 
                src="/profile.jpg" 
                alt="user avatar" 
                className="user-avatar"
              />
              <span className="username">{user.username || "User"}</span>
            </div>
            <div className="wallet">
              <i className="fa-solid fa-wallet"></i><span>${totalBalance}</span>
            </div>
          </>
        ) : (
          <>
            <Link href="/auth">
              <button className="signup-btn">
                SIGN IN
              </button>
            </Link>
            <Link href="/auth">
              <button className="signup-btn" style={{ marginLeft: "10px", background: "transparent", color: "#12d0d8", border: "1px solid #12d0d8" }}>
                SIGN UP
              </button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
