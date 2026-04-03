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
  const showSafe = tile.state === TILE_STATE.SAFE;
  const showMine = tile.state === TILE_STATE.MINE;
  const isRevealed = showSafe || showMine;

  const classes = [
    "mine-tile",
    tile.state,
    isRevealed ? "is-revealed" : "",
    showSafe ? "is-safe" : "",
    showMine ? "is-mine" : "",
    tile.flash ? "flash" : "",
    tile.flashType === TILE_STATE.SAFE ? "flash-safe" : "",
    tile.flashType === TILE_STATE.MINE ? "flash-mine" : "",
    isPending ? "pending" : "",
  ]
    .join(" ")
    .trim();

  const style = {
    ["--reveal-delay" as string]: `${revealDelay}ms`,
  } as CSSProperties;

  const symbolStyle = {
    opacity: isRevealed ? 1 : 0,
    transform: isRevealed ? "translateY(0) scale(1)" : "translateY(14px) scale(0.75)",
    zIndex: isRevealed ? 5 : 1,
  } as CSSProperties;

  function renderTileIcon() {
    if (showSafe) {
      return (
        <svg
          className="tile-icon tile-icon-gem"
          viewBox="0 0 64 64"
          role="img"
          aria-label="Gem"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M41 4H23L2 20.1L32 60l30-39.9z" fill="#a66cff" />
          <path d="M32 60l12.5-39.9H18.8z" fill="#d7b7ff" />
          <path d="M9.5 9.5L2 20.1h16.8L23 4z" fill="#c8a0ff" />
          <path d="M54.5 9.5L41 4l3.5 16.1H62z" fill="#c8a0ff" />
        </svg>
      );
    }

    if (showMine) {
      return (
        <svg
          className="tile-icon tile-icon-mine"
          viewBox="0 0 24 24"
          role="img"
          aria-label="Mine"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="13" r="6.2" fill="#ff5b8f" />
          <circle cx="12" cy="13" r="3.3" fill="#ff8db3" />
          <path d="M9.2 5.2l4.3-2.5 1 1.8-4.3 2.5z" fill="#ffd166" />
          <path d="M15.2 2.9l4.1 0.3-0.2 2-4.1-0.3z" fill="#ffe6a7" />
          <path d="M17.1 5.1l3 2.9-1.4 1.4-3-2.9z" fill="#fff0c7" />
        </svg>
      );
    }

    return null;
  }

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`Tile ${tile.index + 1}`}
      aria-pressed={isRevealed}
      style={style}
    >
      <span className="tile-inner">
        <span className="tile-face tile-front" aria-hidden="true"></span>
      </span>

        {isRevealed ? (
          <span className="tile-overlay-icon" aria-hidden="true" style={symbolStyle}>
            {renderTileIcon()}
          </span>
        ) : null}
    </button>
  );
}