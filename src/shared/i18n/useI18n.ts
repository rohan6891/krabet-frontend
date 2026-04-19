"use client";

import { useEffect, useMemo, useState } from "react";
import { getStoredSession } from "@/shared/utils/session";
import { FALLBACK_LANGUAGE, TRANSLATIONS } from "@/shared/i18n/translations";

const LANGUAGE_CHANGED_EVENT = "krabets:language-changed";

const normalizeLanguage = (value?: string | null): string => {
  if (!value) return FALLBACK_LANGUAGE;
  const code = value.trim().toLowerCase().split("-")[0];
  return code || FALLBACK_LANGUAGE;
};

const getCurrentLanguage = (): string => {
  if (typeof window === "undefined") return FALLBACK_LANGUAGE;

  const sessionLanguage = normalizeLanguage(getStoredSession()?.user?.preferredLanguage);
  if (TRANSLATIONS[sessionLanguage]) return sessionLanguage;

  const browserLanguage = normalizeLanguage(window.navigator.language);
  if (TRANSLATIONS[browserLanguage]) return browserLanguage;

  return FALLBACK_LANGUAGE;
};

export function useI18n() {
  const [language, setLanguage] = useState<string>(() => getCurrentLanguage());

  useEffect(() => {
    const refreshLanguage = () => {
      setLanguage(getCurrentLanguage());
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "krabets_session") {
        refreshLanguage();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(LANGUAGE_CHANGED_EVENT, refreshLanguage);
    refreshLanguage();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LANGUAGE_CHANGED_EVENT, refreshLanguage);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      const selected = TRANSLATIONS[language]?.[key];
      if (selected) return selected;

      const fallbackText = TRANSLATIONS[FALLBACK_LANGUAGE]?.[key];
      if (fallbackText) return fallbackText;

      return fallback || key;
    };
  }, [language]);

  return { language, t };
}

export function notifyLanguageChanged(language?: string) {
  if (typeof window === "undefined") return;

  const normalized = normalizeLanguage(language);
  if (typeof document !== "undefined") {
    document.documentElement.lang = normalized;
  }

  window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGED_EVENT, { detail: { language: normalized } }));
}
