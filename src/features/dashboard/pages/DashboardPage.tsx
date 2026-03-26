"use client";

import "./DashboardPage.css";

export function DashboardPage() {
  const topNavLinks = [
    { label: "Casino", href: "#", active: true },
    { label: "Sports", href: "#" },
    { label: "Live", href: "#" },
    { label: "Promotions", href: "#" },
  ];

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

  const recentWins = [
    {
      amount: "+0.45 BTC",
      amountIcon: "fa-brands fa-bitcoin",
      user: "User55",
      userIcon: "fa-solid fa-user",
      prize: "+18500 DOGE",
      prizeIcon: "fa-solid fa-coins",
    },
    {
      amount: "+1.2 ETH",
      amountIcon: "fa-brands fa-ethereum",
      user: "CryptoKing",
      userIcon: "fa-solid fa-user",
      prize: "+8500 USDT",
      prizeIcon: "fa-solid fa-dollar-sign",
    },
  ];

  const categoryCards = [
    { title: "Casino", subtitle: "1335 games", href: "#", image: "/category1.png" },
    { title: "Racing", subtitle: "2364 games", href: "#", image: "/category1.png" },
    { title: "Poker", subtitle: "1779 games", href: "#", image: "/category1.png" },
    { title: "Lottery", subtitle: "1881 games", href: "#", image: "/category1.png" },
    { title: "Sports", subtitle: "1123 games", href: "#", image: "/category1.png" },
    { title: "Bingo", subtitle: "968 games", href: "#", image: "/category1.png" },
  ];

  const originalCards = [
    { title: "Crash", href: "#", image: "/Kboriginals1.jpg" },
    { title: "Limbo", href: "#", image: "/Kboriginals2.jpg" },
    { title: "Dice", href: "#", image: "/Kboriginals3.jpg" },
    { title: "Plinko", href: "#", image: "/Kboriginals4.jpg" },
    { title: "Wheel", href: "#", image: "/Kboriginals5.jpg" },
    { title: "Slots", href: "#", image: "/Kboriginals6.jpg" },
    { title: "Diamond", href: "#", image: "/Kboriginals7.jpg" },
  ];

  const assets = {
    logo: "/KRABETS-LOGO.png",
    profile: "/profile.avif",
    promoBanner: "/promo-img.jpg",
  };

  return (
    <div className="krabet-page">
      <div className="krabet-shell">
        <aside className="krabet-sidebar">
          <a href="#" className="sidebar-logo-link">
            <img src={assets.logo} alt="KraBet logo" className="sidebar-logo-image" />
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

        <main className="krabet-main">
          <header className="krabet-header">
            <nav className="header-nav">
              {topNavLinks.map((item) => (
                <a
                  href={item.href}
                  key={item.label}
                  className={`header-nav-link ${item.active ? "active" : ""}`}
                >
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
                  <span className="wallet-amount">$12450.78</span>
                  <span className="wallet-crypto">1.25BTC</span>
                </span>
              </a>

              <a href="#" className="header-icon-btn" aria-label="Notifications">
                <i className="fa-solid fa-bell" aria-hidden="true"></i>
              </a>

              <a href="#" className="header-icon-btn" aria-label="More options">
                <i className="fa-solid fa-bars-staggered" aria-hidden="true"></i>
              </a>

              <a href="#" className="profile-link" aria-label="Profile">
                <img src={assets.profile} alt="Profile" className="profile-image" />
              </a>
            </div>
          </header>

          <div className="krabet-content">
            <section className="hero-section">
              <div className="hero-banner" style={{ backgroundImage: `url(${assets.promoBanner})` }}>
                <a href="#" className="hero-banner-cta">
                  JOIN NOW
                </a>
              </div>
            </section>

            <section className="wins-strip">
              <div className="wins-strip-label">RECENT BIG WINS</div>

              <div className="wins-strip-track">
                {recentWins.map((item, index) => (
                  <div className="wins-strip-item" key={index}>
                    <a href="#" className="wins-inline-group">
                      <span className="wins-amount">{item.amount}</span>
                      <span className="wins-inline-icon">
                        <i className={item.amountIcon} aria-hidden="true"></i>
                      </span>
                      <span className="wins-user-icon">
                        <i className={item.userIcon} aria-hidden="true"></i>
                      </span>
                      <span className="wins-user">{item.user}</span>
                    </a>

                    <a href="#" className="wins-inline-group">
                      <span className="wins-prize">{item.prize}</span>
                      <span className="wins-inline-icon">
                        <i className={item.prizeIcon} aria-hidden="true"></i>
                      </span>
                    </a>
                  </div>
                ))}
              </div>
            </section>

            <section className="content-section categories-section">
              <div className="section-title-wrap">
                <h2 className="section-title">GAME CATEGORIES</h2>
              </div>

              <div className="categories-row">
                {categoryCards.map((card) => (
                  <a href={card.href} className="category-box" key={card.title}>
                    <div className="category-box-inner">
                      <div className="category-visual">
                        <img src={card.image} alt={card.title} className="category-card-image" />
                      </div>

                      <div className="category-text">
                        <span className="category-name">{card.title}</span>
                        <span className="category-games">{card.subtitle}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            <section className="content-section originals-section">
              <div className="section-title-wrap">
                <h2 className="section-title">KB ORIGINALS</h2>
              </div>

              <div className="originals-row">
                {originalCards.map((card) => (
                  <a href={card.href} className="original-box" key={card.title}>
                    <img src={card.image} alt={card.title} className="original-card-image" />
                    <div className="original-label">{card.title}</div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
