// components/task-filter.tsx

"use client";

type Props = {
  search: string;
  setSearch: (value: string) => void;

  statusFilter: string;
  setStatusFilter: (value: string) => void;

  priorityFilter: string;
  setPriorityFilter: (value: string) => void;

  typeFilter: string;
  setTypeFilter: (value: string) => void;

  selectedUserId: string | null;
  setSelectedUserId: (value: string | null) => void;

  currentUser?: {
    id: string;
    email: string;
  };

  members: any[];

  statuses: string[];

  tasksCount: number;
};

export function TaskFilter({
  search,
  setSearch,

  statusFilter,
  setStatusFilter,

  priorityFilter,
  setPriorityFilter,

  typeFilter,
  setTypeFilter,

  selectedUserId,
  setSelectedUserId,

  currentUser,

  members,

  statuses,

  tasksCount,
}: Props) {
  return (
    <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* LEFT */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* SEARCH */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="min-w-[220px] flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-black focus:bg-white"
          />

          {/* ASSIGNEE */}
          <select
            value={currentUser?.id || selectedUserId || 'ALL'}
            onChange={(e) =>
              setSelectedUserId(
                e.target.value === "ALL" ? null : e.target.value,
              )
            }
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-black focus:bg-white"
          >
            <option value="ALL">All Tasks</option>

            <option value={currentUser?.id}>My Tasks</option>

            {members
              .filter((m: any) => m.userId !== currentUser?.id)
              .map((m: any) => (
                <option key={m.userId} value={m.userId}>
                  {m.email}
                </option>
              ))}
          </select>

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-black focus:bg-white"
          >
            <option value="">All Status</option>

            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>

          {/* PRIORITY */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-black focus:bg-white"
          >
            <option value="">All Priority</option>

            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          {/* TYPE */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-black focus:bg-white"
          >
            <option value="">All Types</option>

            <option value="TASK">TASK</option>
            <option value="BUG">BUG</option>
            <option value="STORY">STORY</option>
            <option value="EPIC">EPIC</option>
          </select>

          {/* RESET */}
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setPriorityFilter("");
              setTypeFilter("");
              setSelectedUserId(null);
            }}
            className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100"
          >
            Reset
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm">
          <div className="h-2 w-2 rounded-full bg-green-400" />

          <span>
            {tasksCount} Task{tasksCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}