"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getBacklogTasks,
  getProjectMembers,
  getProjectSprints,
  assignTask,
  addTaskToSprint,
  getCurrentUser,
} from "@/lib/api";

import { BacklogSkeleton } from "@/components/skeleton/backlog";
import { TaskActionModalSkeleton } from "@/components/skeleton/task-modal";
import { CreateTaskModal } from "@/components/modals/createTask";
import { TaskFilter } from "@/components/filters/TaskFilter";
import { useToast } from "@/hooks/useToast";

import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";

const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export default function BacklogPage() {
  const { id } = useParams();

  const projectId = id as string;

  const [selectedTask, setSelectedTask] = useState<any>(null);

  // =========================
  // FILTER STATES
  // =========================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [priorityFilter, setPriorityFilter] = useState("");

  const [typeFilter, setTypeFilter] = useState("");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const searchParams = useSearchParams();
  const taskIdFromUrl = searchParams.get("taskId");

  // =========================
  // CURRENT USER
  // =========================

  const { data: currentUserData } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
  });

  const currentUser = currentUserData?.data;

  // =========================
  // BACKLOG TASKS
  // =========================

  const { data, isLoading } = useQuery({
    queryKey: [
      "backlog",
      projectId,
      debouncedSearch,
      statusFilter,
      priorityFilter,
      typeFilter,
      selectedUserId,
    ],

    queryFn: () =>
      getBacklogTasks(projectId, {
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        type: typeFilter || undefined,
        filterUserId: selectedUserId || undefined,
      }),

    enabled: !!projectId,
  });

  const tasks = data?.tasks || [];

  useEffect(() => {
    if (taskIdFromUrl && !isLoading && tasks.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`task-${taskIdFromUrl}`);
        if (el) {
          el.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          el.classList.add("bg-[#DCE2F6]");
          el.classList.add("ring-1");
          el.classList.add("ring-[#7189D0]");

          const removeTimer = setTimeout(() => {
            el.classList.remove("bg-[#DCE2F6]");
            el.classList.remove("ring-2");
            el.classList.remove("ring-[#7189D0]");
          }, 2000);

          return () => clearTimeout(removeTimer);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [taskIdFromUrl, isLoading, tasks]);

  // =========================
  // MEMBERS
  // =========================

  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ["members", projectId],

    queryFn: () => getProjectMembers(projectId),
  });

  const members = membersData?.members || [];

  // =========================
  // SPRINTS
  // =========================

  const { data: sprintData } = useQuery({
    queryKey: ["sprints", projectId],

    queryFn: () => getProjectSprints(projectId),
  });

  const sprints = sprintData?.sprints || [];

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      {/* HEADER */}
      <div className="mb-6 flex justify-between rounded-3xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold">Backlog</h1>

          <p className="mt-1 text-sm text-neutral-500">
            Unassigned tasks (Sprint backlog)
          </p>
        </div>

        <CreateTaskModal projectId={projectId} sprintId={null} />
      </div>

      {/* FILTERS */}
      <TaskFilter
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        currentUser={currentUser}
        members={members}
        statuses={statuses}
        tasksCount={tasks.length}
      />

      {/* LOADING */}
      {isLoading ? (
        <BacklogSkeleton />
      ) : (
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          {/* EMPTY STATE */}
          {tasks.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-5xl">📦</div>

              <h2 className="mt-4 text-xl font-semibold">Backlog is empty</h2>

              <p className="text-sm text-neutral-500">
                No unplanned tasks available
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task: any) => (
                <div
                  key={task.id}
                  className="group flex cursor-pointer items-start justify-between rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  {/* LEFT */}
                  <div className="flex-1">
                    {/* TASK KEY + TYPE */}
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-400">
                      <span>{task.taskKey}</span>

                      <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] text-neutral-600">
                        {task.type}
                      </span>
                    </div>

                    {/* TITLE */}
                    <h3 className="text-lg font-bold text-neutral-900">
                      {task.title}
                    </h3>

                    {/* DESCRIPTION */}
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
                      {task.description || "No description added"}
                    </p>

                    {/* TAGS */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                        {task.status}
                      </div>

                      <div
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          task.priority === "LOW"
                            ? "bg-green-100 text-green-700"
                            : task.priority === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-700"
                              : task.priority === "HIGH"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {task.priority}
                      </div>

                      {task.sprint && (
                        <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                          {task.sprint.name}
                        </div>
                      )}
                    </div>

                    {/* ASSIGNEE */}
                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7189D0] text-sm font-bold text-white">
                        {task.assignee?.email?.charAt(0)?.toUpperCase() || "U"}
                      </div>

                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {task.assignee?.email || "Unassigned"}
                        </div>

                        <div className="text-xs text-neutral-400">
                          Assigned User
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT ACTIONS */}
                  <div className="ml-6 flex flex-col items-end gap-3">
                    {/* DATE */}
                    <div className="text-xs text-neutral-400">
                      {new Date(task.createdAt).toLocaleDateString("en-IN")}
                    </div>

                    {/* MANAGE BUTTON */}
                    <Button
                      onClick={() => setSelectedTask(task)}
                      className="rounded-2xl bg-[#7189D0] cursor-pointer px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      {selectedTask &&
        (isMembersLoading ? (
          <TaskActionModalSkeleton />
        ) : (
          <TaskActionModal
            task={selectedTask}
            members={members}
            sprints={sprints}
            onClose={() => setSelectedTask(null)}
          />
        ))}
    </div>
  );
}

/* ======================================================
   MODAL COMPONENT
====================================================== */

function TaskActionModal({ task, members, sprints, onClose }: any) {
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState("");

  const [selectedSprint, setSelectedSprint] = useState("");
  console.log('selectedUser',)

  const toast = useToast();

  // =========================
  // ASSIGN USER
  // =========================

  const assignMutation = useMutation({
    mutationFn: (assigneeId: string) => assignTask(task.id, assigneeId),

    onSuccess: (data:any) => {
      queryClient.invalidateQueries({
        queryKey: ["backlog"],
      });
      toast.success(data.message || "");

      onClose();
    },
  });

  // =========================
  // MOVE TO SPRINT
  // =========================

  const sprintMutation = useMutation({
    mutationFn: (sprintId: string) => addTaskToSprint(sprintId, task.id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["backlog"],
      });

      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6">
        {/* HEADER */}
        <div className="mb-5 flex justify-between">
          <h2 className="text-xl font-bold">{task.title}</h2>

          <button onClick={onClose}>✕</button>
        </div>

        {/* ASSIGN USER */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">Assign User</label>

          <select
            value={task?.assignee?.id || selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full rounded-2xl border p-3"
          >
            <option value="">Select user</option>

            {members.map((m: any) => (
              <option key={m.userId} value={m.userId}>
                {m.email}
              </option>
            ))}
          </select>

          <Button
            onClick={() => assignMutation.mutate(selectedUser)}
            disabled={!selectedUser}
            className="mt-3 w-full rounded-2xl bg-[#7189D0] py-3 text-white"
          >
            Assign User
          </Button>
        </div>

        {/* MOVE TO SPRINT */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Move to Sprint
          </label>

          <select
            value={selectedSprint}
            onChange={(e) => setSelectedSprint(e.target.value)}
            className="w-full rounded-2xl border p-3"
          >
            <option value="">Select sprint</option>

            {sprints.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <Button
            onClick={() => sprintMutation.mutate(selectedSprint)}
            disabled={!selectedSprint}
            className="mt-3 w-full rounded-2xl bg-[#7189D0] py-3 text-white"
          >
            Move to Sprint
          </Button>
        </div>
      </div>
    </div>
  );
}
