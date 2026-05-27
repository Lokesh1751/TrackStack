"use client";
import WorkspacePage from "./WorkspaceContent";
import { Suspense } from "react";
import { useQueryFilters } from "@/hooks/useQueryFilters";

export default function WorkspacesContent() {
  return (
    <Suspense fallback={null}>
      <WorkspacePage useQueryFilters={useQueryFilters} />
    </Suspense>
  );
}