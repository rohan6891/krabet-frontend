import React, { useEffect, useMemo, useRef, useState } from "react";
import "./LiveChatPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { useChat } from "../hooks/useChat";
const KLIPY_API_KEY = import.meta.env.VITE_KLIPY_API_KEY || "";
const KLIPY_CLIENT_KEY = "krabets_livechat";

// Initial messages removed, using live backend data instead

const EMOJIS = [
  "🔥",
  "😂",
  "💸",
  "🎯",
  "👀",
  "💜",
  "🚀",
  "😭",
  "😮",
  "✅",
  "😎",
  "🤑",
  "🎲",
  "🍀",
  "🙌",
  "⚡",
];

const QUICK_REACTIONS = ["🔥", "💸", "😂", "👀", "🚀", "😭"];

function getBadgeIcon(badge) {
  if (badge === "mod") return "fa-solid fa-shield-halved";
  if (badge === "verified") return "fa-solid fa-circle-check";
  return "";
}

function formatNowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LiveChatPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();
  const { messages: liveMessages, loading, sendMessage: apiSendMessage } = useChat("global");
  
  // Create UI-mapped messages from live backend messages
  const mappedMessages = useMemo(() => {
    return liveMessages.map(msg => ({
      id: msg.id,
      user: msg.user?.username || "System",
      handle: msg.user?.username ? `@${msg.user.username.toLowerCase()}` : "",
      avatar: `https://ui-avatars.com/api/?name=${msg.user?.username || "Sys"}&background=random`,
      level: "VIP 1",
      badge: "none",
      time: new Date(msg.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      type: msg.metadata?.klipy_url ? "sticker" : "text",
      text: msg.message,
      sticker: msg.metadata?.klipy_url,
      replyTo: null,
      reactions: {},
    }));
  }, [liveMessages]);

  const [messageText, setMessageText] = useState("");
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [openReactionPickerId, setOpenReactionPickerId] = useState(null);
  const [klipyQuery, setKlipyQuery] = useState("casino");
  const [klipyResults, setKlipyResults] = useState<any[]>([]);
  const [klipyLoading, setKlipyLoading] = useState(false);
  const [klipyError, setKlipyError] = useState("");
  
  const [showMentionsPanel, setShowMentionsPanel] = useState(false);
  const [mentionsQuery, setMentionsQuery] = useState("");

  const activeUsers = useMemo(() => {
    const uniqueUsers = new Map();
    mappedMessages.forEach(msg => {
      if (!uniqueUsers.has(msg.user) && msg.user !== "System") {
        uniqueUsers.set(msg.user, { user: msg.user, handle: msg.handle, avatar: msg.avatar });
      }
    });
    return Array.from(uniqueUsers.values());
  }, [mappedMessages]);

  const feedRef = useRef<any>(null);
  const textareaRef = useRef<any>(null);

  const visibleKlipyResults = useMemo(() => klipyResults.slice(0, 15), [klipyResults]);

  useEffect(() => {
    fetchKlipyStickers("casino");
  }, []);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [mappedMessages]);

  const fetchKlipyStickers = async (query = "casino") => {
    if (!KLIPY_API_KEY) {
      setKlipyError("Missing Klipy API key. Add VITE_KLIPY_API_KEY to your env.");
      setKlipyResults([]);
      return;
    }

    try {
      setKlipyLoading(true);
      setKlipyError("");

      // Using Klipy's Tenor-compatible migration API endpoint or native endpoint
      const response = await fetch(
        `https://api.klipy.com/tenor/v2/search?q=${encodeURIComponent(
          query
        )}&key=${KLIPY_API_KEY}&client_key=${KLIPY_CLIENT_KEY}&limit=24&media_filter=gif&contentfilter=medium`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();

      const parsedResults =
        data?.results?.map((item: any, index: number) => {
          const mediaUrl =
            item?.media_formats?.tinygif?.url ||
            item?.media_formats?.gif?.url ||
            item?.media_formats?.mediumgif?.url ||
            "";

          return {
            id: `${item.id}-${index}`,
            title: item.content_description || "Sticker",
            url: mediaUrl,
          };
        }) || [];

      setKlipyResults(parsedResults.filter((item: any) => item.url));
    } catch (error) {
      setKlipyError("Failed to load stickers from Klipy.");
      setKlipyResults([]);
    } finally {
      setKlipyLoading(false);
    }
  };

  const appendEmoji = (emoji) => {
    setMessageText((prev) => `${prev}${emoji}`);
    textareaRef.current?.focus();
  };

  const sendStickerMessage = async (sticker: any) => {
    await apiSendMessage("", sticker.url);
    setReplyingTo(null);
    setShowStickerPanel(false);
  };

  const sendMessage = async () => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    await apiSendMessage(trimmed);

    setMessageText("");
    setReplyingTo(null);
    setShowEmojiPanel(false);
    setOpenReactionPickerId(null);
  };

  const handleEnterSend = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleReply = (message: any) => {
    setReplyingTo(message);
    setShowEmojiPanel(false);
    setShowStickerPanel(false);
    textareaRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const addReaction = (messageId: string, emoji: string) => {
    // We can handle local state for reactions, but since it requires backend
    // changes for persistence, we'll just ignore local mocking for now or
    // implement a local state override.
    setOpenReactionPickerId(null);
  };

  const handleTextareaChange = (e: any) => {
    const val = e.target.value;
    setMessageText(val);

    const lastWord = val.split(" ").pop();
    if (lastWord && lastWord.startsWith("@")) {
      setShowMentionsPanel(true);
      setMentionsQuery(lastWord.slice(1).toLowerCase());
      setShowEmojiPanel(false);
      setShowStickerPanel(false);
    } else {
      setShowMentionsPanel(false);
    }
  };

  const handleStickerSearch = (event: any) => {
    if (event.key === "Enter") {
      fetchKlipyStickers(klipyQuery || "casino");
    }
  };

  const insertMention = (handle: string) => {
    const words = messageText.split(" ");
    words.pop();
    const newText = words.length > 0 ? words.join(" ") + ` ${handle} ` : `${handle} `;
    setMessageText(newText);
    setShowMentionsPanel(false);
    textareaRef.current?.focus();
  };

  const filteredMentions = useMemo(() => {
    if (!mentionsQuery) return activeUsers;
    return activeUsers.filter((u: any) => 
      u.user.toLowerCase().includes(mentionsQuery) || 
      u.handle.toLowerCase().includes(mentionsQuery)
    );
  }, [activeUsers, mentionsQuery]);

  if (isChecking) {
    return <div className="dashboard-auth-loading" aria-hidden="true"></div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="krabet-page">
      <div className="krabet-shell">
        <DashboardSidebar logoSrc="/KRABETS-LOGO.png" />
        <main className="krabet-main">
          <DashboardHeader
            walletBalance={walletBalance}
            username={profile.username}
            email={profile.email}
            avatarUrl={profile.avatarUrl}
            displayName={profile.displayName}
            country={profile.country}
            phoneNumber={profile.phoneNumber}
            phoneCountryCode={profile.phoneCountryCode}
            preferredLanguage={profile.preferredLanguage}
            dateOfBirth={profile.dateOfBirth}
          />

          <div className="krabet-content dfr-root" style={{ padding: "0" }}>
        
      <div className="live-chat-shell" style={{ height: "calc(100vh - 80px)" }}>
        <header className="chat-topbar">
          <div className="chat-topbar-left">
            <div className="chat-topbar-icon">
              <i className="fa-solid fa-comments"></i>
            </div>

            <div className="chat-topbar-copy">
              <h1>Public Chat</h1>
              <p>{activeUsers.length} active members</p>
            </div>
          </div>

          <div className="chat-topbar-right">
            <button className="topbar-btn" onClick={() => setShowMentionsPanel(!showMentionsPanel)}>
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>
        </header>

        <section className="chat-feed" ref={feedRef}>
          {mappedMessages.map((message) => (
            <article className="chat-row" key={message.id}>
              <img className="chat-avatar" src={message.avatar} alt={message.user} />

              <div className="chat-body">
                <div className="chat-head">
                  <div className="chat-head-left">
                    <span className="chat-username">{message.user}</span>
                    <span className="chat-level">{message.level}</span>

                    {message.badge !== "none" && (
                      <span className={`chat-badge ${message.badge}`}>
                        <i className={getBadgeIcon(message.badge)}></i>
                      </span>
                    )}
                  </div>

                  <span className="chat-time">{message.time}</span>
                </div>

                <div
                  className={`chat-bubble ${
                    message.type === "emoji"
                      ? "emoji-only"
                      : message.type === "sticker"
                      ? "sticker-bubble"
                      : ""
                  }`}
                >
                  {message.replyTo && (
                    <div className="reply-preview">
                      <span className="reply-preview-name">
                        <i className="fa-solid fa-reply"></i>
                        Replying to {message.replyTo.user}
                      </span>
                      <p>{message.replyTo.text}</p>
                    </div>
                  )}

                  <div className="chat-meta-line">
                    <span className="chat-handle">{message.handle}</span>
                  </div>

                  {message.type === "sticker" ? (
                    <img className="chat-sticker" src={message.sticker} alt={message.text} />
                  ) : (
                    <p>{message.text}</p>
                  )}
                </div>

                {!!Object.keys(message.reactions || {}).length && (
                  <div className="reaction-list">
                    {Object.entries(message.reactions).map(([emoji, count]) => (
                      <button
                        key={`${message.id}-${emoji}`}
                        className="reaction-chip"
                        onClick={() => addReaction(message.id, emoji)}
                      >
                        <span>{emoji}</span>
                        <strong>{count}</strong>
                      </button>
                    ))}
                  </div>
                )}

                <div className="message-actions">
                  <div className="reaction-picker-wrap">
                    <button
                      className="message-action-btn"
                      onClick={() =>
                        setOpenReactionPickerId((prev) =>
                          prev === message.id ? null : message.id
                        )
                      }
                    >
                      <i className="fa-regular fa-face-smile"></i>
                      React
                    </button>

                    {openReactionPickerId === message.id && (
                      <div className="reaction-picker">
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={`${message.id}-picker-${emoji}`}
                            className="reaction-picker-btn"
                            onClick={() => addReaction(message.id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button className="message-action-btn" onClick={() => handleReply(message)}>
                    <i className="fa-solid fa-reply"></i>
                    Reply
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      <div className="floating-composer-wrap">
        {(showEmojiPanel || showStickerPanel || showMentionsPanel || replyingTo) && (
          <div className="composer-overlay-stack">
            {showMentionsPanel && (
              <div className="composer-popover mentions-popover" style={{ maxHeight: "300px", display: "flex", flexDirection: "column" }}>
                <div className="popover-head">
                  <strong>
                    <i className="fa-solid fa-at"></i>
                    Mention User
                  </strong>
                  <button className="popover-close-btn" onClick={() => setShowMentionsPanel(false)}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div className="tenor-search-row" style={{ padding: "8px" }}>
                  <div className="tenor-search-input">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="text"
                      value={mentionsQuery}
                      onChange={(e) => setMentionsQuery(e.target.value)}
                      placeholder="Search users..."
                      autoFocus
                    />
                  </div>
                </div>
                <div className="mentions-list" style={{ overflowY: "auto", flex: 1 }}>
                  {filteredMentions.length > 0 ? (
                    filteredMentions.map((u: any) => (
                      <div 
                        key={u.user} 
                        className="mention-user-row" 
                        onClick={() => insertMention(u.handle)}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <img src={u.avatar} alt={u.user} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, fontSize: "14px", color: "#fff" }}>{u.user}</span>
                          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{u.handle}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "16px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>No active users found.</div>
                  )}
                </div>
              </div>
            )}

            {replyingTo && (
              <div className="active-reply-bar">
                <div className="active-reply-text">
                  <span>
                    <i className="fa-solid fa-reply"></i>
                    Replying to {replyingTo.user}
                  </span>
                  <p>{replyingTo.type === "sticker" ? "[Sticker]" : replyingTo.text}</p>
                </div>

                <button className="close-reply-btn" onClick={cancelReply}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}

            {showEmojiPanel && (
              <div className="composer-popover emoji-popover">
                <div className="popover-head">
                  <strong>
                    <i className="fa-regular fa-face-smile"></i>
                    Emoji
                  </strong>
                  <button className="popover-close-btn" onClick={() => setShowEmojiPanel(false)}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div className="emoji-grid">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      className="emoji-btn"
                      onClick={() => appendEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showStickerPanel && (
              <div className="composer-popover sticker-popover">
                <div className="popover-head">
                  <strong>
                    <i className="fa-solid fa-photo-film"></i>
                    Stickers
                  </strong>
                  <button className="popover-close-btn" onClick={() => setShowStickerPanel(false)}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div className="tenor-search-row">
                  <div className="tenor-search-input">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="text"
                      value={klipyQuery}
                      onChange={(e) => setKlipyQuery(e.target.value)}
                      onKeyDown={handleStickerSearch}
                      placeholder="Search stickers..."
                    />
                  </div>

                  <button
                    className="tenor-search-btn"
                    onClick={() => fetchKlipyStickers(klipyQuery || "casino")}
                  >
                    Search
                  </button>
                </div>

                {klipyLoading && <div className="tenor-state">Loading stickers...</div>}
                {klipyError && <div className="tenor-state error">{klipyError}</div>}

                {!klipyLoading && !klipyError && (
                  <div className="sticker-grid">
                    {visibleKlipyResults.map((sticker) => (
                      <button
                        key={sticker.id}
                        className="sticker-card"
                        onClick={() => sendStickerMessage(sticker)}
                      >
                        <img src={sticker.url} alt={sticker.title} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="floating-composer">
          <button className="composer-icon-btn composer-plus-btn">
            <i className="fa-solid fa-plus"></i>
          </button>

          <div className="composer-input-shell">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={handleTextareaChange}
              onKeyDown={handleEnterSend}
              placeholder="Message"
              rows={1}
            />
          </div>

          <button
            className={`composer-icon-btn ${showEmojiPanel ? "active" : ""}`}
            onClick={() => {
              setShowEmojiPanel((prev) => !prev);
              setShowStickerPanel(false);
            }}
          >
            <i className="fa-regular fa-face-smile"></i>
          </button>

          <button
            className={`composer-icon-btn ${showStickerPanel ? "active" : ""}`}
            onClick={() => {
              setShowStickerPanel((prev) => !prev);
              setShowEmojiPanel(false);
            }}
          >
            <i className="fa-solid fa-photo-film"></i>
          </button>

          <button className="send-btn" onClick={sendMessage}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
          </div>
          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}