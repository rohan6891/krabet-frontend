"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./LiveChat.css";
// @ts-ignore side-effect stylesheet import is handled by Next.js runtime
import "@/features/dashboard/pages/DashboardPage.css";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { useChat } from "../hooks/useChat";

const KLIPY_API_KEY = process.env.NEXT_PUBLIC_KLIPY_API_KEY || "";
const KLIPY_CLIENT_KEY = process.env.NEXT_PUBLIC_KLIPY_CLIENT_KEY || "";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function getBadgeIcon(badge: string) {
  if (badge === "mod") return "fa-solid fa-shield-halved";
  if (badge === "verified") return "fa-solid fa-circle-check";
  return "";
}

/* ─────────────────────── ChatWidget ─────────────────────── */
interface ChatWidgetProps {
  roomCode: string;
  onClose?: () => void;
}

export function ChatWidget({ roomCode, onClose }: ChatWidgetProps) {
  const { messages: liveMessages, loading, sendMessage: apiSendMessage } = useChat(roomCode);

  const mappedMessages: any[] = useMemo(() => {
    return liveMessages.map((msg: any) => ({
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
      replyTo: msg.replyTo || null,
      reactions: {},
    }));
  }, [liveMessages]);

  /* ── state ── */
  const [messageText, setMessageText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<"emoji" | "gif" | "sticker">("emoji");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [openReactionPickerId, setOpenReactionPickerId] = useState<any>(null);
  const [klipyQuery, setKlipyQuery] = useState("");
  const [klipyResults, setKlipyResults] = useState<any[]>([]);
  const [klipyLoading, setKlipyLoading] = useState(false);
  const [klipyError, setKlipyError] = useState("");
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stickerPreview, setStickerPreview] = useState<any>(null);
  const [emojis, setEmojis] = useState<string[]>([]);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [showFullReactionPickerId, setShowFullReactionPickerId] = useState<string | null>(null);

  const renderMessageText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return (
      <p>
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            return <span key={i} className="wa-mention-text">{part}</span>;
          }
          return part;
        })}
      </p>
    );
  };

  useEffect(() => {
    let mounted = true;
    fetch("https://raw.githubusercontent.com/github/gemoji/master/db/emoji.json")
      .then((res) => res.json())
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          const fetched = data.map((item: any) => item.emoji).filter(Boolean);
          setEmojis(fetched);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const activeUsers = useMemo(() => {
    const m = new Map();
    mappedMessages.forEach((msg) => {
      if (!m.has(msg.user) && msg.user !== "System")
        m.set(msg.user, { user: msg.user, handle: msg.handle, avatar: msg.avatar });
    });
    return Array.from(m.values());
  }, [mappedMessages]);

  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgRefsMap = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [mappedMessages]);

  /* ── scroll to a message by ID ── */
  const scrollToMessage = useCallback((msgId: string) => {
    const el = msgRefsMap.current.get(msgId);
    if (el && feedRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 2000);
    }
  }, []);

  /* ── Klipy fetch (GIF or Sticker) ── */
  const fetchKlipy = async (query: string, type: "gif" | "sticker") => {
    if (!KLIPY_API_KEY) { setKlipyResults([]); return; }
    try {
      setKlipyLoading(true);
      setKlipyError("");
      const ep = type === "gif" ? "gifs" : "stickers";
      const res = await fetch(
        `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/${ep}/search?q=${encodeURIComponent(query || "trending")}&per_page=24&content_filter=medium${KLIPY_CLIENT_KEY ? `&customer_id=${KLIPY_CLIENT_KEY}` : ""}`
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      const items = json?.data?.data || [];
      const parsed = items.map((it: any, i: number) => {
        const url =
          it?.file?.sm?.gif?.url || it?.file?.sm?.webp?.url ||
          it?.file?.md?.gif?.url || it?.file?.md?.webp?.url ||
          it?.file?.hd?.gif?.url || "";
        return { id: `${it.id}-${i}`, title: it.title || type, url };
      });
      setKlipyResults(parsed.filter((r: any) => r.url));
    } catch (e) {
      console.error("Klipy:", e);
      setKlipyError("Failed to load. Check API key.");
      setKlipyResults([]);
    } finally {
      setKlipyLoading(false);
    }
  };

  /* ── tab switch ── */
  const switchTab = (tab: "emoji" | "gif" | "sticker") => {
    setPickerTab(tab);
    if (tab !== "emoji") { setKlipyQuery(""); fetchKlipy("trending", tab); }
  };

  const toggleSearch = () => {
    setShowSearchPanel((p) => !p);
    setSearchQuery("");
    setPickerOpen(false);
  };

  const togglePicker = () => {
    setPickerOpen((p) => !p);
    setShowSearchPanel(false);
  };

  const appendEmoji = (e: string) => { setMessageText((p) => p + e); inputRef.current?.focus(); };

  const handleSelectSticker = (s: any) => {
    setStickerPreview(s);
    setPickerOpen(false);
  };

  const confirmSendSticker = async () => {
    if (stickerPreview) {
      await apiSendMessage(messageText.trim(), stickerPreview.url);
      setStickerPreview(null);
      setMessageText("");
      setReplyingTo(null);
    }
  };

  const cancelStickerPreview = () => {
    setStickerPreview(null);
  };

  const sendMessage = async () => {
    const t = messageText.trim();
    if (!t) return;
    await apiSendMessage(t);
    setMessageText("");
    setReplyingTo(null);
    setPickerOpen(false);
    setOpenReactionPickerId(null);
  };

  const onKeyDown = (ev: any) => {
    if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); sendMessage(); }
  };

  const handleReply = (m: any) => { setReplyingTo(m); setPickerOpen(false); inputRef.current?.focus(); };
  const cancelReply = () => setReplyingTo(null);
  const addReaction = (_id: string, _emoji: string) => setOpenReactionPickerId(null);

  const onInputChange = (e: any) => {
    const v = e.target.value;
    setMessageText(v);
    const last = v.split(" ").pop();
    if (last && last.startsWith("@")) {
      setShowSearchPanel(true);
      setSearchQuery(last.slice(1).toLowerCase());
      setPickerOpen(false);
    } else {
      // Don't auto-close if the user manually opened it via the search button
      // But if it was auto-opened via '@', we can handle that logic if needed
    }
  };

  const insertMention = (handle: string) => {
    const words = messageText.split(" ");
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith("@")) {
      words.pop();
    }
    setMessageText(words.length ? words.join(" ") + ` ${handle} ` : `${handle} `);
    setShowSearchPanel(false);
    inputRef.current?.focus();
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return activeUsers;
    return activeUsers.filter((u: any) =>
      u.user.toLowerCase().includes(searchQuery) || u.handle.toLowerCase().includes(searchQuery)
    );
  }, [activeUsers, searchQuery]);

  /* ── render ── */
  return (
    <div className="wa-chat-shell">
      {/* Top bar */}
      <header className="wa-topbar">
        <div className="wa-topbar-left">
          <div className="wa-topbar-icon"><i className="fa-solid fa-comments"></i></div>
          <div className="wa-topbar-info">
            <h1>{roomCode === "global" ? "Public Chat" : `${roomCode.charAt(0).toUpperCase() + roomCode.slice(1)} Chat`}</h1>
            <p><span className="wa-live-dot"></span>{activeUsers.length} online</p>
          </div>
        </div>
        <div className="wa-topbar-actions">
          <button className="wa-topbar-btn" onClick={toggleSearch} title="Search users">
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
          {onClose && (
            <button className="wa-topbar-btn wa-topbar-close" onClick={onClose} title="Close chat">
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </header>

      {/* User Search Overlay – Full view popup style */}
      {showSearchPanel && (
        <div className="wa-search-overlay">
          <div className="wa-search-panel">
            <div className="wa-search-hdr">
              <button className="wa-search-back" onClick={() => setShowSearchPanel(false)}>
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <div className="wa-search-input-wrap">
                <input 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="Search users..." 
                  autoFocus 
                />
                {searchQuery && (
                  <button className="wa-search-clear" onClick={() => setSearchQuery("")}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="wa-search-results">
              <div className="wa-search-label">ACTIVE USERS</div>
              {filteredUsers.length > 0 ? filteredUsers.map((u: any) => (
                <div key={u.user} className="wa-search-row" onClick={() => insertMention(u.handle)}>
                  <img src={u.avatar} alt={u.user} />
                  <div className="wa-search-row-info">
                    <strong>{u.user}</strong>
                    <span>{u.handle}</span>
                  </div>
                </div>
              )) : (
                <div className="wa-search-empty">
                  <i className="fa-solid fa-user-slash"></i>
                  <p>No users found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Reaction Picker Overlay */}
      {showFullReactionPickerId && (
        <div className="wa-search-overlay" onClick={() => setShowFullReactionPickerId(null)}>
          <div className="wa-search-panel wa-full-react-panel" onClick={(e) => e.stopPropagation()}>
            <div className="wa-search-hdr">
              <button className="wa-search-back" onClick={() => setShowFullReactionPickerId(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
              <div style={{ padding: 0, fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>Reactions</div>
            </div>
            <div className="wa-search-results wa-full-react-results">
              <div className="wa-emoji-grid">
                {emojis.map((em, i) => (
                  <button key={`${em}-${i}`} className="wa-emoji-btn" onClick={() => {
                    addReaction(showFullReactionPickerId, em);
                    setShowFullReactionPickerId(null);
                  }}>{em}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="wa-feed" ref={feedRef}>
        {mappedMessages.length === 0 && !loading && (
          <div className="wa-empty"><i className="fa-regular fa-comments"></i><p>No messages yet. Be the first!</p></div>
        )}
        {loading && mappedMessages.length === 0 && (
          <div className="wa-empty"><p>Loading…</p></div>
        )}
        {mappedMessages.map((msg) => (
          <article
            className={`wa-msg ${highlightedMsgId === msg.id ? "wa-msg-highlight" : ""}`}
            key={msg.id}
            id={`msg-${msg.id}`}
            ref={(el) => { if (el) msgRefsMap.current.set(msg.id, el); }}
          >
            <img className="wa-msg-avatar" src={msg.avatar} alt={msg.user} />
            <div className="wa-msg-body">
              <div className="wa-msg-head">
                <span className="wa-msg-user">{msg.user}</span>
                <span className="wa-msg-lvl">{msg.level}</span>
                {msg.badge !== "none" && <span className={`wa-msg-badge ${msg.badge}`}><i className={getBadgeIcon(msg.badge)}></i></span>}
                <span className="wa-msg-time">{msg.time}</span>
              </div>

              <div className={`wa-bubble ${msg.type === "sticker" ? "sticker" : ""}`}>
                {msg.replyTo && (
                  <div
                    className="wa-reply-ref"
                    onClick={() => scrollToMessage(msg.replyTo.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <span><i className="fa-solid fa-reply"></i> {msg.replyTo.user}</span>
                    <p>{msg.replyTo.text}</p>
                  </div>
                )}
                {msg.type === "sticker" ? (
                  <img className="wa-sticker-img" src={msg.sticker} alt={msg.text} />
                ) : (
                  renderMessageText(msg.text)
                )}
              </div>

              {!!Object.keys(msg.reactions || {}).length && (
                <div className="wa-reactions">
                  {Object.entries((msg.reactions as Record<string, number>) || {}).map(([em, c]) => (
                    <button key={`${msg.id}-${em}`} className="wa-react-chip" onClick={() => addReaction(msg.id, em)}>
                      <span>{em}</span><strong>{c as number}</strong>
                    </button>
                  ))}
                </div>
              )}

              <div className="wa-msg-actions">
                <div className="wa-react-wrap">
                  <button className="wa-action-btn" onClick={() => setOpenReactionPickerId((p: any) => p === msg.id ? null : msg.id)}>
                    <i className="fa-regular fa-face-smile"></i>
                  </button>
                  {openReactionPickerId === msg.id && (
                    <div className="wa-react-picker">
                      {QUICK_REACTIONS.map((r) => (
                        <button key={r} className="wa-react-opt" onClick={() => addReaction(msg.id, r)}>{r}</button>
                      ))}
                      <button className="wa-react-opt wa-react-plus" onClick={() => {
                        setShowFullReactionPickerId(msg.id);
                        setOpenReactionPickerId(null);
                      }}>
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>
                  )}
                </div>
                <button className="wa-action-btn" onClick={() => handleReply(msg)}>
                  <i className="fa-solid fa-reply"></i>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Composer area */}
      <div className="wa-composer-zone">
        {/* Reply bar – WhatsApp style */}
        {replyingTo && (
          <div className="wa-reply-strip">
            <div className="wa-reply-strip-accent"></div>
            <div className="wa-reply-strip-content">
              <span className="wa-reply-strip-user">{replyingTo.user}</span>
              <p className="wa-reply-strip-text">
                {replyingTo.type === "sticker" ? (
                  <><i className="fa-solid fa-note-sticky"></i> Sticker</>
                ) : (
                  replyingTo.text
                )}
              </p>
            </div>
            <button className="wa-reply-strip-close" onClick={cancelReply}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* Picker panel */}
        {pickerOpen && (
          <div className="wa-picker">
            <div className="wa-picker-tabs">
              <button className={pickerTab === "emoji" ? "active" : ""} onClick={() => switchTab("emoji")} title="Emoji">
                <i className="fa-regular fa-face-smile"></i>
              </button>
              <button className={pickerTab === "gif" ? "active" : ""} onClick={() => switchTab("gif")} title="GIF">
                GIF
              </button>
              <button className={pickerTab === "sticker" ? "active" : ""} onClick={() => switchTab("sticker")} title="Stickers">
                <i className="fa-solid fa-note-sticky"></i>
              </button>
            </div>

            {(pickerTab === "gif" || pickerTab === "sticker") && (
              <div className="wa-panel-search">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  value={klipyQuery}
                  onChange={(e) => setKlipyQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") fetchKlipy(klipyQuery || "trending", pickerTab); }}
                  placeholder={`Search ${pickerTab === "gif" ? "GIFs" : "Stickers"}…`}
                />
              </div>
            )}

            <div className="wa-picker-body">
              {pickerTab === "emoji" && (
                <div className="wa-emoji-grid">
                  {emojis.map((em, i) => (
                    <button key={`${em}-${i}`} className="wa-emoji-btn" onClick={() => appendEmoji(em)}>{em}</button>
                  ))}
                </div>
              )}

              {pickerTab !== "emoji" && (
                <>
                  {klipyLoading && <div className="wa-picker-msg">Loading…</div>}
                  {klipyError && <div className="wa-picker-msg error">{klipyError}</div>}
                  {!klipyLoading && !klipyError && (
                    <div className="wa-media-grid">
                      {klipyResults.map((item) => (
                        <button key={item.id} className="wa-media-card" onClick={() => handleSelectSticker(item)}>
                          <img src={item.url} alt={item.title} loading="lazy" />
                        </button>
                      ))}
                      {klipyResults.length === 0 && <div className="wa-picker-msg">No results</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="wa-input-row">
          <button className="wa-input-icon" onClick={togglePicker}>
            <i className={pickerOpen ? "fa-solid fa-xmark" : "fa-regular fa-face-smile"}></i>
          </button>

          <input
            ref={inputRef}
            className="wa-text-input"
            value={messageText}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder="Type a message"
          />

          <button className="wa-send" onClick={sendMessage} disabled={!messageText.trim()}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>

      {/* Sticker Preview Overlay */}
      {stickerPreview && (
        <div className="wa-sticker-preview-overlay">
          <button className="wa-preview-close" onClick={cancelStickerPreview}>
            <i className="fa-solid fa-xmark"></i>
          </button>
          
          <div className="wa-preview-content">
            <img src={stickerPreview.url} alt="Sticker Preview" />
          </div>

          <div className="wa-preview-footer">
            <div className="wa-preview-input-wrap">
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={messageText}
                onChange={onInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); confirmSendSticker(); }
                }}
              />
              <button className="wa-preview-emoji-btn" onClick={togglePicker}>
                <i className="fa-regular fa-face-smile"></i>
              </button>
            </div>
            <button className="wa-preview-send" onClick={confirmSendSticker}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Page wrapper ─────────────────────── */
export function LiveChatPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();

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
            <div style={{ height: "calc(100vh - 80px)", width: "100%" }}>
              <ChatWidget roomCode="global" />
            </div>
          </div>
          <MobileBottomDock />
        </main>
      </div>
    </div>
  );
}