"use client";

import { useEffect, useState } from "react";

export function useCountdown(initialSeconds: number): number {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

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
