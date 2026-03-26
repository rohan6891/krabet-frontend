import { GameImageWithSkeleton } from "@/features/dashboard/components/GameImageWithSkeleton";
import type { DashboardGame } from "@/features/dashboard/types/dashboard.types";

type OriginalsSectionProps = {
  games: DashboardGame[];
  loading: boolean;
};

function OriginalsSkeletonRow() {
  return (
    <div className="originals-row">
      {Array.from({ length: 7 }).map((_, index) => (
        <div className="original-box skeleton-card" key={`original-skeleton-${index}`}>
          <div className="skeleton-block original-image-skeleton"></div>
          <div className="skeleton-block original-label-skeleton"></div>
        </div>
      ))}
    </div>
  );
}

export function OriginalsSection({ games, loading }: OriginalsSectionProps) {
  return (
    <section className="content-section originals-section">
      <div className="section-title-wrap">
        <h2 className="section-title">KB ORIGINALS</h2>
      </div>

      {loading ? (
        <OriginalsSkeletonRow />
      ) : (
        <div className="originals-row">
          {games.map((card) => (
            <a href="#" className="original-box" key={card.id}>
              <GameImageWithSkeleton src={card.image_path || ""} alt={card.name} className="original-card-image" />
              <div className="original-label">{card.name}</div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
