"use client";

import { useEffect, useState } from "react";

export function useCountdown(initialSeconds: number, resetSignal = 0): number {
  const [secondsLeft, setSecondsLeft] = useState(Math.max(0, Math.floor(initialSeconds)));

  useEffect(() => {
    setSecondsLeft(Math.max(0, Math.floor(initialSeconds)));
  }, [initialSeconds, resetSignal]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [secondsLeft]);

  return secondsLeft;
}
