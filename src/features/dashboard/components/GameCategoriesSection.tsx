import Link from "next/link";
import { GameImageWithSkeleton } from "@/features/dashboard/components/GameImageWithSkeleton";
import type { DashboardGame } from "@/features/dashboard/types/dashboard.types";
import { getDashboardGameHref } from "@/features/dashboard/utils/gameNavigation";

type GameCategoriesSectionProps = {
  games: DashboardGame[];
  loading: boolean;
};

const categoryLabels = ["Casino", "Racing", "Poker", "Lottery", "Sports", "Bingo"];

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
  const cards = games.slice(0, 6);
  const fallbackCards: DashboardGame[] = categoryLabels.map((label, index) => ({
    id: `category-${label}-${index}`,
    code: label.toLowerCase(),
    name: label,
    status: true,
    image_path: undefined,
  }));
  const cardsToRender: DashboardGame[] = cards.length ? cards : fallbackCards;

  return (
    <section className="content-section categories-section">
      <div className="section-title-wrap">
        <h2 className="section-title">GAME CATEGORIES</h2>
      </div>

      {loading ? (
        <CategorySkeletonRow />
      ) : (
        <div className="categories-row">
          {cardsToRender.map((card) => (
            <Link href={getDashboardGameHref(card)} className="category-box" key={card.id}>
              <div className="category-box-inner">
                <div className="category-visual">
                  <GameImageWithSkeleton
                    src={card.image_path || "/game_category.png"}
                    alt={card.name}
                    className="category-card-image"
                  />
                </div>

                <div className="category-text">
                  <span className="category-name">{card.name}</span>
                  <span className="category-games">Trending game</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
