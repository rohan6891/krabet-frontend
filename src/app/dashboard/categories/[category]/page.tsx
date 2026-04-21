"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { CategoryGamesPage } from "@/features/dashboard/pages/CategoryGamesPage";

type CategoryKey = "casino" | "sports" | "live" | "lottery";

export default function CategoryRoutePage() {
  const params = useParams<{ category: string }>();
  const router = useRouter();
  const rawCategory = (params?.category || "casino").toLowerCase();

  useEffect(() => {
    if (["sports", "live", "lottery"].includes(rawCategory)) {
      router.replace(`/dashboard/categories/coming-soon/${rawCategory}`);
    }
  }, [rawCategory, router]);

  const safeCategory: CategoryKey = ["casino", "sports", "live", "lottery"].includes(rawCategory)
    ? (rawCategory as CategoryKey)
    : "casino";

  if (safeCategory !== "casino") {
    return null;
  }

  return <CategoryGamesPage category={safeCategory} />;
}
