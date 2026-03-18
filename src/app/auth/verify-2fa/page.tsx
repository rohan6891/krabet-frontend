import { Suspense } from "react";
import { VerifyTwoFactorPage } from "@/features/auth/pages/VerifyTwoFactorPage";

export default function VerifyTwoFactorRoutePage() {
  return (
    <Suspense fallback={null}>
      <VerifyTwoFactorPage />
    </Suspense>
  );
}
