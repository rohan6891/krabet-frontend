"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessTokenFromStorage } from "@/shared/utils/session";

export function useDashboardAuthGuard() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getAccessTokenFromStorage();

    if (!token) {
      setIsAuthenticated(false);
      setIsChecking(false);
      router.replace("/auth");
      return;
    }

    setIsAuthenticated(true);
    setIsChecking(false);
  }, [router]);

  return { isChecking, isAuthenticated };
}
