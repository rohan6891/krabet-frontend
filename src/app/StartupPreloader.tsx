"use client";

import { useEffect, useState } from "react";
import "./loading.css";

const PRELOADER_DURATION_MS = 2000;

export function StartupPreloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, PRELOADER_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="krabet-preloader" role="status" aria-live="polite" aria-label="Loading">
      <div className="krabet-preloader-inner">
        <img src="/KRABETS-LOGO.png" alt="Krabets logo" className="krabet-preloader-logo" draggable="false" />

        <div className="krabet-preloader-text-wrap">
          <span className="krabet-preloader-text">Loading</span>
          <span className="krabet-preloader-dots" aria-hidden="true">
            <span className="krabet-dot">.</span>
            <span className="krabet-dot">.</span>
            <span className="krabet-dot">.</span>
          </span>
        </div>
      </div>
    </div>
  );
}