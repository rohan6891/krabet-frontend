import { GameImageWithSkeleton } from "@/features/dashboard/components/GameImageWithSkeleton";
import type { DashboardGame } from "@/features/dashboard/types/dashboard.types";

type GameCategoriesSectionProps = {
  games: DashboardGame[];
  loading: boolean;
};

function CategorySkeletonRow() {
  return (
    <div className="categories-row">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="category-box skeleton-card" key={`category-skeleton-${index}`}>
          <div className="category-box-inner">
            <div className="skeleton-block skeleton-circle"></div>
            <div className="skeleton-lines">
              <div className="skeleton-block skeleton-line"></div>
              <div className="skeleton-block skeleton-line short"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GameCategoriesSection({ games, loading }: GameCategoriesSectionProps) {
  return (
    <section className="content-section categories-section">
      <div className="section-title-wrap">
        <h2 className="section-title">GAME CATEGORIES</h2>
      </div>

      {loading ? (
        <CategorySkeletonRow />
      ) : (
        <div className="categories-row">
          {games.map((card) => (
            <a href="#" className="category-box" key={card.id}>
              <div className="category-box-inner">
                <div className="category-visual">
                  <GameImageWithSkeleton
                    src={card.image_path || ""}
                    alt={card.name}
                    className="category-card-image"
                  />
                </div>

                <div className="category-text">
                  <span className="category-name">{card.name}</span>
                  <span className="category-games">{card.subtitle || "Trending game"}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
