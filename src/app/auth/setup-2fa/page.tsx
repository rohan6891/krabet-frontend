import { Suspense } from "react";
import { SetupTwoFactorPage } from "@/features/auth/pages/SetupTwoFactorPage";

export default function SetupTwoFactorRoutePage() {
  return (
    <Suspense fallback={null}>
      <SetupTwoFactorPage />
    </Suspense>
  );
}
