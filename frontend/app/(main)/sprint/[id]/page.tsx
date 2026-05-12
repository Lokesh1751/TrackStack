"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  Play,
  CheckCircle2,
  Plus,
  Loader2,
  Target,
  Trash2,
} from "lucide-react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import {
  getProjectSprints,
  createSprint,
  startSprint,
  completeSprint,
  deleteSprint,
} from "@/lib/api";

export default function SprintPage() {
  const { id } = useParams();

  const projectId = id as string;

  const queryClient = useQueryClient();

  const router = useRouter();

  // =========================
  // FORM
  // =========================

  const [form, setForm] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });

  // =========================
  // GET SPRINTS
  // =========================

  const { data, isLoading } = useQuery({
    queryKey: ["sprints", projectId],
    queryFn: () => getProjectSprints(projectId),
    enabled: !!projectId,
  });

  const sprints = data?.sprints || [];
  const activeSprintid = sprints.find(
    (sprint) => sprint.status === "ACTIVE",
  )?.id;

  // =========================
  // CREATE SPRINT
  // =========================

  const createSprintMutation = useMutation({
    mutationFn: () =>
      createSprint(projectId, {
        ...form,
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : undefined,

        endDate: form.endDate
          ? new Date(form.endDate).toISOString()
          : undefined,
      }),

    onSuccess: () => {
      toast.success("Sprint created");

      setForm({
        name: "",
        goal: "",
        startDate: "",
        endDate: "",
      });

      queryClient.invalidateQueries({
        queryKey: ["sprints", projectId],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // =========================
  // START SPRINT
  // =========================

  const startSprintMutation = useMutation({
    mutationFn: (sprintId: string) => startSprint(sprintId),

    onSuccess: () => {
      toast.success("Sprint started");

      queryClient.invalidateQueries({
        queryKey: ["sprints", projectId],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // =========================
  // COMPLETE SPRINT
  // =========================

  const completeSprintMutation = useMutation({
    mutationFn: (sprintId: string) => completeSprint(sprintId),

    onSuccess: () => {
      toast.success("Sprint completed");

      queryClient.invalidateQueries({
        queryKey: ["sprints", projectId],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // =========================
  // DELETE SPRINT
  // =========================

  const deleteSprintMutation = useMutation({
    mutationFn: (sprintId: string) => deleteSprint(sprintId),

    onSuccess: () => {
      toast.success("Sprint deleted");

      queryClient.invalidateQueries({
        queryKey: ["sprints", projectId],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Sprint Management
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Plan, start and manage agile sprints
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                router.push(`/tasks/${projectId}?sprint=${activeSprintid}`)
              }
              className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:border-black"
            >
              Go To Board
            </button>

            <button
              onClick={() => router.push(`/sprint/${projectId}/backlog`)}
              className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:border-black"
            >
              Backlog Tasks
            </button>
          </div>
        </div>

        {/* ========================= */}
        {/* CREATE SPRINT */}
        {/* ========================= */}

        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
              <Plus className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold">Create New Sprint</h2>

              <p className="text-sm text-neutral-500">
                Define sprint timeline and goals
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <input
              placeholder="Sprint name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              className="rounded-2xl border border-neutral-200 bg-white p-4 outline-none transition focus:border-black"
            />

            <input
              placeholder="Sprint goal"
              value={form.goal}
              onChange={(e) =>
                setForm({
                  ...form,
                  goal: e.target.value,
                })
              }
              className="rounded-2xl border border-neutral-200 bg-white p-4 outline-none transition focus:border-black"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-600">
                Start Date
              </label>

              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startDate: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-neutral-200 bg-white p-4 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-600">
                End Date
              </label>

              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endDate: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-neutral-200 bg-white p-4 outline-none transition focus:border-black"
              />
            </div>
          </div>

          <button
            onClick={() => createSprintMutation.mutate()}
            disabled={createSprintMutation.isPending}
            className="mt-6 flex items-center gap-2 rounded-2xl bg-black px-6 py-4 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {createSprintMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Sprint
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================= */}
      {/* SPRINT LIST */}
      {/* ========================= */}

      {isLoading ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {sprints.map((sprint: any) => (
            <div
              key={sprint.id}
              className="group rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-black hover:shadow-xl"
            >
              {/* TOP */}
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div
                    className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                      sprint.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : sprint.status === "COMPLETED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {sprint.status}
                  </div>

                  <h2 className="text-2xl font-bold text-neutral-900">
                    {sprint.name}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    {sprint.goal || "No sprint goal added"}
                  </p>
                </div>

                <button
                  onClick={() => deleteSprintMutation.mutate(sprint.id)}
                  disabled={deleteSprintMutation.isPending}
                  className="rounded-2xl bg-red-50 p-3 text-red-500 transition hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* INFO */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-neutral-500">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase">
                      Timeline
                    </span>
                  </div>

                  <div className="text-sm font-medium text-neutral-800">
                    {sprint.startDate
                      ? new Date(sprint.startDate).toLocaleDateString("en-IN")
                      : "--"}
                  </div>

                  <div className="mt-1 text-xs text-neutral-400">
                    to{" "}
                    {sprint.endDate
                      ? new Date(sprint.endDate).toLocaleDateString("en-IN")
                      : "--"}
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-neutral-500">
                    <Target className="h-4 w-4" />

                    <span className="text-xs font-semibold uppercase">
                      Tasks
                    </span>
                  </div>

                  <div className="text-2xl font-bold text-neutral-900">
                    {sprint.tasks.length || 0}
                  </div>

                  <div className="text-xs text-neutral-400">Tasks Assigned</div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-6 flex flex-wrap gap-3">
                {sprint.status === "PLANNED" && (
                  <button
                    onClick={() => startSprintMutation.mutate(sprint.id)}
                    disabled={startSprintMutation.isPending}
                    className="flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    {startSprintMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Start Sprint
                  </button>
                )}

                {sprint.status === "ACTIVE" && (
                  <button
                    onClick={() => completeSprintMutation.mutate(sprint.id)}
                    disabled={completeSprintMutation.isPending}
                    className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    {completeSprintMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Complete Sprint
                  </button>
                )}

                <button
                  onClick={() =>
                    router.push(`/tasks/${projectId}?sprint=${sprint.id}`)
                  }
                  className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:border-black"
                >
                  Open Board
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EMPTY */}
      {!isLoading && sprints.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-white py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
            <CalendarDays className="h-10 w-10 text-neutral-400" />
          </div>

          <h2 className="mt-6 text-2xl font-bold">No Sprints Yet</h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
            Create your first sprint to start planning and managing tasks
            efficiently.
          </p>
        </div>
      )}
    </div>
  );
}
