export const sidebarTopLinks = [
  { label: "Casino", href: "/dashboard", icon: "fa-solid fa-dice-d6" },
  { label: "Mines", href: "/dashboard/mines", icon: "fa-solid fa-bomb" },
  { label: "Limbo", href: "/dashboard/limbo", icon: "fa-solid fa-rocket" },
  { label: "Coinflip", href: "/dashboard/coinflip", icon: "fa-solid fa-coins" },
  { label: "Search", href: "/dashboard/search", icon: "fa-solid fa-magnifying-glass" },
  { label: "Wallet", href: "/dashboard/wallet", icon: "fa-solid fa-wallet" },
];

export const sidebarBottomLinks = [
  { label: "Promotions", href: "/dashboard", icon: "fa-solid fa-gift" },
  { label: "VIP Club", href: "/dashboard", icon: "fa-solid fa-crown" },
  { label: "Bonus", href: "/dashboard", icon: "fa-solid fa-coins" },
  { label: "Referral", href: "/dashboard", icon: "fa-solid fa-user-plus" },
  { label: "Form", href: "/dashboard/settings", icon: "fa-regular fa-file-lines" },
  { label: "Responsible Gambling", href: "/dashboard/settings", icon: "fa-solid fa-shield-halved" },
];

type DashboardSidebarProps = {
  logoSrc: string;
};

export function DashboardSidebar({ logoSrc }: DashboardSidebarProps) {
  return (
    <aside className="krabet-sidebar">
      <a href="/dashboard" className="sidebar-logo-link">
        <img src={logoSrc} alt="KraBet logo" className="sidebar-logo-image" />
      </a>

      <div className="sidebar-panel sidebar-panel-top">
        {sidebarTopLinks.map((item) => (
          <a href={item.href} className="sidebar-link" key={item.label}>
            <span className="sidebar-link-icon">
              <i className={item.icon} aria-hidden="true"></i>
            </span>
            <span className="sidebar-link-text">{item.label}</span>
          </a>
        ))}
      </div>

      <div className="sidebar-panel sidebar-panel-bottom">
        {sidebarBottomLinks.map((item) => (
          <a href={item.href} className="sidebar-link" key={item.label}>
            <span className="sidebar-link-icon">
              <i className={item.icon} aria-hidden="true"></i>
            </span>
            <span className="sidebar-link-text">{item.label}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}
