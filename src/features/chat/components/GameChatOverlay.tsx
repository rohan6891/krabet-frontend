"use client";

import React, { useState, useEffect } from "react";
import "./GameChatOverlay.css";
import { ChatWidget } from "./LiveChat";
import { useChat } from "../hooks/useChat";

export function GameChatOverlay({ roomCode }: { roomCode: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { messages } = useChat(roomCode);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setUnreadCount((prev) => prev + 1);
    } else {
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  return (
    <div className="game-chat-overlay-wrapper">
      <button 
        className="game-chat-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Game Chat"
      >
        {isOpen ? (
          <i className="fa-solid fa-xmark"></i>
        ) : (
          <>
            <i className="fa-solid fa-comments"></i>
            {unreadCount > 0 && (
              <span className="chat-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
            )}
          </>
        )}
      </button>

      <div className={`game-chat-drawer ${isOpen ? "open" : ""}`}>
        <ChatWidget roomCode={roomCode} />
      </div>
    </div>
  );
}
