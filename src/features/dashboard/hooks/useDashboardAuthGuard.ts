"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe } from "@/features/dashboard/api/dashboard.api";
import { clearAuthSession, getAccessTokenFromStorage } from "@/shared/utils/session";

export function useDashboardAuthGuard() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function runAuthCheck() {
      const token = getAccessTokenFromStorage();

      if (!token) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setIsChecking(false);
          router.replace("/auth");
        }
        return;
      }

      try {
        await fetchMe(token);
        if (cancelled) {
          return;
        }
        setIsAuthenticated(true);
      } catch {
        clearAuthSession();
        if (!cancelled) {
          setIsAuthenticated(false);
          router.replace("/auth");
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    }

    runAuthCheck();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { isChecking, isAuthenticated };
}
