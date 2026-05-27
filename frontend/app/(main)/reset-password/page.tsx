"use client";
import ResetPasswordPage from "./ResetPasswordContent";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPageContent() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPage searchParams={useSearchParams} />
    </Suspense>
  );
}
