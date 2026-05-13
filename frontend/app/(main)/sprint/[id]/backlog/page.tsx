"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBacklogTasks,
  getProjectMembers,
  getProjectSprints,
  assignTask,
  addTaskToSprint,
} from "@/lib/api";

import { BacklogSkeleton } from "@/components/skeleton/backlog";
import { TaskActionModalSkeleton } from "@/components/skeleton/task-modal";
import { CreateTaskModal } from "@/components/modals/createTask";

export default function BacklogPage() {
  const { id } = useParams();
  const projectId = id as string;

  const [selectedTask, setSelectedTask] = useState<any>(null);

  // =========================
  // BACKLOG TASKS
  // =========================

  const { data, isLoading } = useQuery({
    queryKey: ["backlog", projectId],
    queryFn: () => getBacklogTasks(projectId),
    enabled: !!projectId,
  });

  const tasks = data?.tasks || [];

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
      <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backlog</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Unassigned tasks (Sprint backlog)
          </p>
        </div>
        <CreateTaskModal projectId={projectId} sprintId={undefined} />
      </div>

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
                  className="group flex justify-between rounded-2xl border bg-white p-5 transition hover:border-black"
                >
                  {/* LEFT */}
                  <div>
                    <div className="text-xs text-neutral-400">
                      {task.taskKey}
                    </div>

                    <h3 className="text-lg font-semibold">{task.title}</h3>

                    <p className="text-sm text-neutral-500">
                      {task.description || "No description"}
                    </p>

                    <div className="mt-2 text-xs text-neutral-500">
                      👤 {task.assignee?.email || "Unassigned"}
                    </div>
                  </div>

                  {/* ACTION */}
                  <div className="opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="rounded-xl bg-black px-3 py-2 text-xs text-white"
                    >
                      Manage
                    </button>
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

  // =========================
  // ASSIGN USER
  // =========================

  const assignMutation = useMutation({
    mutationFn: (assigneeId: string) => assignTask(task.id, assigneeId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backlog"] });
      onClose();
    },
  });

  // =========================
  // MOVE TO SPRINT
  // =========================

  const sprintMutation = useMutation({
    mutationFn: (sprintId: string) => addTaskToSprint(sprintId, task.id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backlog"] });
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
            value={selectedUser}
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

          <button
            onClick={() => assignMutation.mutate(selectedUser)}
            disabled={!selectedUser}
            className="mt-3 w-full rounded-2xl bg-black py-3 text-white"
          >
            Assign User
          </button>
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

          <button
            onClick={() => sprintMutation.mutate(selectedSprint)}
            disabled={!selectedSprint}
            className="mt-3 w-full rounded-2xl bg-blue-600 py-3 text-white"
          >
            Move to Sprint
          </button>
        </div>
      </div>
    </div>
  );
}
