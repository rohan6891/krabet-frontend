import { ProfileAvatar } from "@/features/dashboard/components/ProfileAvatar";

const topNavLinks = [
  { label: "Casino", href: "#", active: true },
  { label: "Sports", href: "#" },
  { label: "Live", href: "#" },
  { label: "Promotions", href: "#" },
];

type DashboardHeaderProps = {
  walletBalance: string;
  username: string;
  avatarUrl: string | null;
};

export function DashboardHeader({ walletBalance, username, avatarUrl }: DashboardHeaderProps) {
  return (
    <header className="krabet-header">
      <nav className="header-nav">
        {topNavLinks.map((item) => (
          <a href={item.href} key={item.label} className={`header-nav-link ${item.active ? "active" : ""}`}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="header-actions">
        <a href="#" className="wallet-pill">
          <span className="wallet-pill-icon">
            <i className="fa-solid fa-wallet" aria-hidden="true"></i>
          </span>

          <span className="wallet-pill-text">
            <span className="wallet-amount">${walletBalance}</span>
            <span className="wallet-crypto">Wallet</span>
          </span>
        </a>

        <a href="#" className="header-icon-btn" aria-label="Notifications">
          <i className="fa-solid fa-bell" aria-hidden="true"></i>
        </a>

        <a href="#" className="header-icon-btn" aria-label="More options">
          <i className="fa-solid fa-bars-staggered" aria-hidden="true"></i>
        </a>

        <a href="#" className="profile-link" aria-label="Profile">
          <ProfileAvatar username={username} avatarUrl={avatarUrl} />
        </a>
      </div>
    </header>
  );
}
