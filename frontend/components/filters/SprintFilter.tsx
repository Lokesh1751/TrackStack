"use client";

import { useEffect, useState } from "react";

import { useDebounce } from "@/hooks/useDebounce";

type Props = {
  filters: {
    search: string;
    status: string;
    startDate: string;
    endDate: string;
  };

  setFilters: React.Dispatch<
    React.SetStateAction<{
      search: string;
      status: string;
      startDate: string;
      endDate: string;
    }>
  >;
};

const initialFilters = {
  search: "",
  status: "",
  startDate: "",
  endDate: "",
};

export function SprintFilter({ filters, setFilters }: Props) {
  const [searchInput, setSearchInput] = useState(filters.search);

  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearch,
    }));
  }, [debouncedSearch, setFilters]);

  const handleReset = () => {
    setSearchInput("");

    setFilters(initialFilters);
  };

  return (
    <div className="mb-6 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* SEARCH */}
        <input
          placeholder="Search sprint..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="rounded-2xl border border-neutral-200 bg-white p-3 text-sm outline-none transition focus:border-black"
        />

        {/* STATUS */}
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: e.target.value,
            }))
          }
          className="rounded-2xl border border-neutral-200 bg-white p-3 text-sm outline-none transition focus:border-black"
        >
          <option value="">All Status</option>

          <option value="PLANNED">PLANNED</option>

          <option value="ACTIVE">ACTIVE</option>

          <option value="COMPLETED">COMPLETED</option>
        </select>

        {/* START DATE */}
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              startDate: e.target.value,
            }))
          }
          className="rounded-2xl border border-neutral-200 bg-white p-3 text-sm outline-none transition focus:border-black"
        />

        {/* END DATE */}
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              endDate: e.target.value,
            }))
          }
          className="rounded-2xl border border-neutral-200 bg-white p-3 text-sm outline-none transition focus:border-black"
        />

        {/* RESET */}
        <button
          onClick={handleReset}
          className="rounded-2xl border border-black bg-black px-4 py-3 text-sm font-medium text-white transition cursor-pointer"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
