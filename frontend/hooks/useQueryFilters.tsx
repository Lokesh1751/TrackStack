"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function useQueryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const get = (key: string) => searchParams.get(key) || "";

  const set = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "ALL") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.replace(`?${params.toString()}`);
  };

  return {
    get,
    set,
  };
}