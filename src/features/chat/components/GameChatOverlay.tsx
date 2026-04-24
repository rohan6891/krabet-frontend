"use client";

import React, { useState } from "react";
import "./GameChatOverlay.css";
import { ChatWidget } from "./LiveChat";

export function GameChatOverlay({ roomCode }: { roomCode: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="game-chat-overlay-wrapper">
      {/* Floating toggle – only visible when drawer is closed */}
      {!isOpen && (
        <button
          className="game-chat-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open Game Chat"
        >
          <i className="fa-solid fa-comments"></i>
        </button>
      )}

      <div className={`game-chat-drawer ${isOpen ? "open" : ""}`}>
        <ChatWidget roomCode={roomCode} onClose={() => setIsOpen(false)} />
      </div>
    </div>
  );
}
