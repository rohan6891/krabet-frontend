const sidebarTopLinks = [
  { label: "Casino", href: "#", icon: "fa-solid fa-dice-d6" },
  { label: "Sports", href: "#", icon: "fa-solid fa-futbol" },
  { label: "Lottery", href: "#", icon: "fa-solid fa-ticket" },
  { label: "Crypto Futures", href: "#", icon: "fa-solid fa-bitcoin-sign" },
];

const sidebarBottomLinks = [
  { label: "Promotions", href: "#", icon: "fa-solid fa-gift" },
  { label: "VIP Club", href: "#", icon: "fa-solid fa-crown" },
  { label: "Bonus", href: "#", icon: "fa-solid fa-coins" },
  { label: "Referral", href: "#", icon: "fa-solid fa-user-plus" },
  { label: "Form", href: "#", icon: "fa-regular fa-file-lines" },
  { label: "Responsible Gambling", href: "#", icon: "fa-solid fa-shield-halved" },
];

type DashboardSidebarProps = {
  logoSrc: string;
};

export function DashboardSidebar({ logoSrc }: DashboardSidebarProps) {
  return (
    <aside className="krabet-sidebar">
      <a href="#" className="sidebar-logo-link">
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
