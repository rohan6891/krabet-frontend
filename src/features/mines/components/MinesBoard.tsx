import { MineTile } from "@/features/mines/components/MineTile";
import { MinesStats } from "@/features/mines/components/MinesStats";
import { TILE_STATE } from "@/features/mines/constants/mines.constants";
import type { MineTileView } from "@/features/mines/types/mines.types";

type MinesBoardProps = {
  gridSize: number;
  minesCount: number;
  tiles: MineTileView[];
  statusText: string;
  multiplier: number;
  payoutNow: number;
  isPlaying: boolean;
  isBusy: boolean;
  pendingTileIndex: number | null;
  revealDelayByIndex: Record<number, number>;
  isLossAnimating: boolean;
  onTileClick: (index: number) => void;
  pulseMultiplier: boolean;
  pulsePayout: boolean;
};

export function MinesBoard({
  gridSize,
  minesCount,
  tiles,
  statusText,
  multiplier,
  payoutNow,
  isPlaying,
  isBusy,
  pendingTileIndex,
  revealDelayByIndex,
  isLossAnimating,
  onTileClick,
  pulseMultiplier,
  pulsePayout,
}: MinesBoardProps) {
  return (
    <section className={`mines-board-panel ${isLossAnimating ? "board-shake" : ""}`.trim()}>
      <div className="board-top">
        <div className="section-intro">
          <h2>Mines Board</h2>
          <p>Click tiles to reveal backend results.</p>
        </div>

        <div className="board-pills">
          <span className="board-pill">
            <i className="fa-solid fa-bomb"></i>
            {minesCount} Mines
          </span>
          <span className="board-pill">
            <i className="fa-solid fa-grip"></i>
            {gridSize}x{gridSize}
          </span>
        </div>
      </div>

      <div className="board-grid-wrap">
        <div className="mines-grid" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
          {tiles.map((tile) => {
            const isDisabled = !isPlaying || isBusy || tile.state !== TILE_STATE.HIDDEN;

            return (
              <MineTile
                key={tile.index}
                tile={tile}
                isDisabled={isDisabled}
                isPending={pendingTileIndex === tile.index}
                revealDelay={revealDelayByIndex[tile.index] || 0}
                onClick={() => onTileClick(tile.index)}
              />
            );
          })}
        </div>
      </div>

      <MinesStats
        variant="board"
        statusText={statusText}
        multiplier={multiplier}
        payoutNow={payoutNow}
        pulseMultiplier={pulseMultiplier}
        pulsePayout={pulsePayout}
      />
    </section>
  );
}
