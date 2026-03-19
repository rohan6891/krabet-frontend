import { Suspense } from "react";
import { OAuthCompleteEmailPage } from "@/features/auth/pages/OAuthCompleteEmailPage";

export default function OAuthCompleteEmailRoutePage() {
  return (
    <Suspense fallback={null}>
      <OAuthCompleteEmailPage />
    </Suspense>
  );
}
