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
import { SprintPageSkeleton } from "@/components/skeleton/sprint";
import { CreateTaskModal } from "@/components/modals/createTask";
import { SprintFilter } from "@/components/filters/SprintFilter";

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

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  // =========================
  // GET SPRINTS
  // =========================

  const { data, isLoading } = useQuery({
    queryKey: ["sprints", projectId, filters],

    queryFn: () =>
      getProjectSprints(projectId, {
        search: filters.search || undefined,
        status: filters.status || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      }),
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
      <div className="flex flex-col gap-2 justify-between bg-white p-4 rounded-lg mb-3">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Sprints</h1>
        <SprintFilter filters={filters} setFilters={setFilters} />
      </div>

      {isLoading ? (
        <SprintPageSkeleton />
      ) : (
        <div className="space-y-6">
          {sprints.length > 0 ? (
            <div className="grid gap-6 xl:grid-cols-2">
              {sprints.map((sprint: any) => {
                const isActive = sprint.status === "ACTIVE";
                const isCompleted = sprint.status === "COMPLETED";
                const isPlanned = sprint.status === "PLANNED";

                return (
                  <div
                    key={sprint.id}
                    className="group relative overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* HEADER */}
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div
                          className={`mb-4 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] ${
                            isActive
                              ? "bg-green-100 text-green-700"
                              : isCompleted
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {sprint.status}
                        </div>

                        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                          {sprint.name}
                        </h2>

                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-500">
                          {sprint.goal || "No sprint goal added"}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteSprintMutation.mutate(sprint.id)}
                        disabled={deleteSprintMutation.isPending}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* STATS */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* TIMELINE */}
                      <div className="rounded-3xl border border-neutral-100 bg-neutral-50 p-5">
                        <div className="mb-4 flex items-center gap-2 text-neutral-500">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                            <CalendarDays className="h-4 w-4" />
                          </div>

                          <span className="text-xs font-bold uppercase tracking-wide">
                            Timeline
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-neutral-900">
                            {sprint.startDate
                              ? new Date(sprint.startDate).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "--"}
                          </div>

                          <div className="text-xs text-neutral-400">
                            to{" "}
                            {sprint.endDate
                              ? new Date(sprint.endDate).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "--"}
                          </div>
                        </div>
                      </div>

                      {/* TASK COUNT */}
                      <div className="rounded-3xl border border-neutral-100 bg-neutral-50 p-5">
                        <div className="mb-4 flex items-center gap-2 text-neutral-500">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                            <Target className="h-4 w-4" />
                          </div>

                          <span className="text-xs font-bold uppercase tracking-wide">
                            Tasks
                          </span>
                        </div>

                        <div className="text-3xl font-bold tracking-tight text-neutral-900">
                          {sprint.tasks.length || 0}
                        </div>

                        <div className="mt-1 text-xs text-neutral-400">
                          Tasks assigned in sprint
                        </div>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-7 border-t border-neutral-100 pt-6">
                      <div className="flex flex-wrap gap-3">
                        {isPlanned && (
                          <button
                            onClick={() =>
                              startSprintMutation.mutate(sprint.id)
                            }
                            disabled={startSprintMutation.isPending}
                            className="flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                          >
                            {startSprintMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            Start Sprint
                          </button>
                        )}

                        {isActive && (
                          <button
                            onClick={() =>
                              completeSprintMutation.mutate(sprint.id)
                            }
                            disabled={completeSprintMutation.isPending}
                            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
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
                            router.push(
                              `/tasks/${projectId}?sprint=${sprint.id}`,
                            )
                          }
                          className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:border-black hover:bg-neutral-50"
                        >
                          Open Board
                        </button>

                        {sprint.status === "ACTIVE" && (
                          <button
                            onClick={() =>
                              router.push(`/sprint/${sprint.id}/dashboard`)
                            }
                            className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium transition hover:border-black hover:bg-neutral-50"
                          >
                            Analysis
                          </button>
                        )}

                        <CreateTaskModal
                          projectId={projectId}
                          sprintId={sprint.id}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-neutral-300 bg-white py-28 text-center shadow-sm">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100">
                <CalendarDays className="h-11 w-11 text-neutral-400" />
              </div>

              <h2 className="mt-7 text-3xl font-bold tracking-tight text-neutral-900">
                No Sprints Yet
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-7 text-neutral-500">
                Create your first sprint to start planning, tracking and
                managing tasks efficiently across your agile workflow.
              </p>

              <button
                onClick={() =>
                  document
                    .querySelector("input")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="mt-8 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Create First Sprint
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
