import Link from "next/link";
import "./landing.css";

const featureCards = [
  {
    icon: "fa-solid fa-dice",
    title: "Premium Casino Games",
    text: "Play sleek, modern originals and classic favorites in a polished gaming environment.",
  },
  {
    icon: "fa-solid fa-bolt",
    title: "Fast Experience",
    text: "Smooth navigation, responsive layouts, and lightning-fast access across all devices.",
  },
  {
    icon: "fa-solid fa-shield-halved",
    title: "Secure Platform",
    text: "Built for confidence with a refined interface and a trustworthy experience.",
  },
];

const statCards = [
  { icon: "fa-solid fa-coins", label: "Daily Rewards" },
  { icon: "fa-solid fa-trophy", label: "Competitive Play" },
  { icon: "fa-solid fa-mobile-screen-button", label: "Mobile Ready" },
];

export default function Home() {
  return (
    <main className="krabets-landing">
      <div className="krabets-landing-overlay" />

      <header className="krabets-landing-header">
        <div className="krabets-brand">
          <img src="/KRABETS-LOGO.png" alt="Krabets logo" className="krabets-brand-logo" />
        </div>

        <Link href="/auth" className="krabets-signin-btn">
          <i className="fa-solid fa-right-to-bracket" />
          <span>Sign Up</span>
        </Link>
      </header>

      <section className="krabets-hero">
        <div className="krabets-hero-copy">
          <div className="krabets-pill">
            <i className="fa-solid fa-crown" />
            <span>Next-Level Casino Experience</span>
          </div>

          <h1>WELCOME TO KRABETS</h1>

          <p>
            Step into a premium gaming destination with Rewards and Bonuses, modern gameplay, and a smooth
            experience across desktop and mobile.
          </p>

          <div className="krabets-hero-actions">
            <Link href="/auth" className="krabets-cta-primary">
              <i className="fa-solid fa-user-plus" />
              <span>Sign In</span>
            </Link>

            <Link href="/dashboard" className="krabets-cta-secondary">
              <i className="fa-solid fa-compass" />
              <span>Explore Lobby</span>
            </Link>
          </div>

          <div className="krabets-stats-row">
            {statCards.map((item) => (
              <div className="krabets-stat-card" key={item.label}>
                <i className={item.icon} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="krabets-hero-panel">
          <div className="krabets-panel-card">
            <div className="krabets-panel-badge">Why Players Choose Krabets</div>

            <div className="krabets-feature-list">
              {featureCards.map((item) => (
                <article className="krabets-feature-card" key={item.title}>
                  <div className="krabets-feature-icon">
                    <i className={item.icon} />
                  </div>

                  <div className="krabets-feature-text">
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="krabets-bottom-strip">
        <div className="krabets-bottom-item">
          <i className="fa-solid fa-star" />
          <span>Sleek UI</span>
        </div>
        <div className="krabets-bottom-item">
          <i className="fa-solid fa-fire" />
          <span>Responsive Design</span>
        </div>
        <div className="krabets-bottom-item">
          <i className="fa-solid fa-gem" />
          <span>Premium Feel</span>
        </div>
      </section>
    </main>
  );
}
