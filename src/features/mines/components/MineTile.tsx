import type { CSSProperties } from "react";
import { TILE_STATE } from "@/features/mines/constants/mines.constants";
import type { MineTileView } from "@/features/mines/types/mines.types";

type MineTileProps = {
  tile: MineTileView;
  isDisabled: boolean;
  isPending: boolean;
  revealDelay: number;
  onClick: () => void;
};

export function MineTile({ tile, isDisabled, isPending, revealDelay, onClick }: MineTileProps) {
  const classes = [
    "mine-tile",
    tile.state,
    tile.flash ? "flash" : "",
    tile.flashType === TILE_STATE.SAFE ? "flash-safe" : "",
    tile.flashType === TILE_STATE.MINE ? "flash-mine" : "",
    isPending ? "pending" : "",
  ]
    .join(" ")
    .trim();

  const showSafe = tile.state === TILE_STATE.SAFE;
  const showMine = tile.state === TILE_STATE.MINE;

  const style = {
    ["--reveal-delay" as string]: `${revealDelay}ms`,
  } as CSSProperties;

  return (
    <button className={classes} onClick={onClick} disabled={isDisabled} aria-label={`Tile ${tile.index + 1}`} style={style}>
      <span className="tile-inner">
        <span className="tile-face tile-front">
          <i className="fa-solid fa-diamond-turn-right"></i>
        </span>
        <span className="tile-face tile-back">
          {showSafe ? <i className="fa-solid fa-gem"></i> : null}
          {showMine ? <i className="fa-solid fa-bomb"></i> : null}
        </span>
      </span>
    </button>
  );
}
