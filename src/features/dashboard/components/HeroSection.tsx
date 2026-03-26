import type { SyntheticEvent } from "react";

type HeroSectionProps = {
  promoBanner: string;
};

const withPngFallback = (event: SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;

  if (image.src.endsWith(".png")) {
    return;
  }

  image.src = image.src.replace(/\.jpg$/i, ".png");
};

export function HeroSection({ promoBanner }: HeroSectionProps) {
  return (
    <section className="hero-section">
      <div className="hero-side-image hero-side-image-left" aria-hidden="true">
        <img src="/model-left.jpg" alt="" onError={withPngFallback} />
      </div>

      <div className="hero-banner" style={{ backgroundImage: `url(${promoBanner})` }}>
        <a href="#" className="hero-banner-cta">
          JOIN NOW
        </a>
      </div>

      <div className="hero-side-image hero-side-image-right" aria-hidden="true">
        <img src="/model-right.jpg" alt="" onError={withPngFallback} />
      </div>
    </section>
  );
}
