"use client";

import { useEffect, useState } from "react";
import "./ScrollToTopButton.css";

const SHOW_THRESHOLD_PX = 280;

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > SHOW_THRESHOLD_PX);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      className="scroll-top-btn"
      aria-label="Scroll to top"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>
    </button>
  );
}