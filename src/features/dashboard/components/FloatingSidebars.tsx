import "./FloatingSidebars.css";

interface Game {
  id: number | string;
  title: string;
  image: string;
  href: string;
}

interface FloatingSidebarsProps {
  games?: Game[];
}

export function FloatingSidebars({ games = [] }: FloatingSidebarsProps) {

  const leftNavItems = [
    { id: "home", label: "Home", iconClass: "fa-solid fa-house", href: "/" },
    { id: "search", label: "Search", iconClass: "fa-solid fa-magnifying-glass", href: "/search" },
    { id: "settings", label: "Settings", iconClass: "fa-solid fa-gear", href: "/settings" },
    { id: "notifications", label: "Alerts", iconClass: "fa-solid fa-bell", href: "/notifications" },
    { id: "wallet", label: "Wallet", iconClass: "fa-solid fa-wallet", href: "/wallet" },
    { id: "bonuses", label: "Bonuses", iconClass: "fa-solid fa-gift", href: "/bonuses" },
  ];

  return (
    <>
      {/* LEFT SIDEBAR */}
      <aside className="floating-sidebar left-sidebar">
        <div className="sidebar-top-group">
          {leftNavItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="sidebar-nav-item"
              aria-label={item.label}
              title={item.label}
            >
              <span className="sidebar-icon-box">
                <i className={item.iconClass} aria-hidden="true"></i>
              </span>
              <span className="sidebar-label">{item.label}</span>
            </a>
          ))}
        </div>

      </aside>

      {/* RIGHT SIDEBAR */}
      <aside className="floating-sidebar right-sidebar">
        <div className="right-sidebar-top">
          <a
            href="/history"
            className="sidebar-nav-item history-button"
            aria-label="History"
            title="History"
          >
            <span className="sidebar-icon-box">
              <i className="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
            </span>
            <span className="sidebar-label">History</span>
          </a>
        </div>

        <div className="right-sidebar-games">
          {games.map((game) => (
            <a
              key={game.id}
              href={game.href}
              className="sidebar-game-card"
              aria-label={game.title}
              title={game.title}
            >
              <div className="sidebar-game-thumb-wrap">
                <img
                  src={game.image}
                  alt={game.title}
                  className="sidebar-game-thumb"
                />
              </div>
              <span className="sidebar-game-title">{game.title}</span>
            </a>
          ))}
        </div>
      </aside>
    </>
  );
}
