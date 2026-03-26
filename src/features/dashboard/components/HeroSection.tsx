type HeroSectionProps = {
  promoBanner: string;
};

export function HeroSection({ promoBanner }: HeroSectionProps) {
  return (
    <section className="hero-section">
      <div className="hero-banner" style={{ backgroundImage: `url(${promoBanner})` }}>
        <a href="#" className="hero-banner-cta">
          JOIN NOW
        </a>
      </div>
    </section>
  );
}
