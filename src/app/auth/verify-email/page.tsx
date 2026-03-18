import { Suspense } from "react";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";

export default function VerifyEmailRoutePage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPage />
    </Suspense>
  );
}
