type HeroSectionProps = {
  promoBanner: string;
};

export function HeroSection({ promoBanner }: HeroSectionProps) {
  return (
    <section className="hero-section">
      <div className="hero-side-image hero-side-image-left" aria-hidden="true">
        <img src="/model-left.png" alt="" />
      </div>

      <div className="hero-banner" style={{ backgroundImage: `url(${promoBanner})` }}>
        <a href="#" className="hero-banner-cta">
          JOIN NOW
        </a>
      </div>

      <div className="hero-side-image hero-side-image-right" aria-hidden="true">
        <img src="/model-right.png" alt="" />
      </div>
    </section>
  );
}
