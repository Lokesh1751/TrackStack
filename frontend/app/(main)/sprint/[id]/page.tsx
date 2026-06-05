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
  ArrowRight,
  Sparkles,
  FolderKanban,
  Activity,
  Clock3,
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
import { Button } from "@/components/ui/button";

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
  // FILTERS
  // =========================

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
    (sprint: any) => sprint.status === "ACTIVE",
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
      toast.success("Sprint created successfully");

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
    <div className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto  px-4 py-8 md:px-6">
        {/* ========================= */}
        {/* HERO */}
        {/* ========================= */}

        <div className="relative overflow-hidden rounded-[36px] border border-[#dbe2f3] bg-gradient-to-br from-[#f8faff] via-white to-[#eef3ff] p-8 shadow-sm">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#7189D0]/10 blur-3xl" />

          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#7189D0]/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            {/* LEFT */}
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8e1f6] bg-white px-4 py-2 text-sm font-medium text-[#4c5f99] shadow-sm">
                <Sparkles className="h-4 w-4" />
                Agile Sprint Workspace
              </div>

              <h1 className="text-5xl font-black tracking-tight text-[#111827]">
                Sprint Management
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                Plan sprint timelines, organize agile workflows, manage
                development cycles and streamline delivery with a modern sprint
                management experience.
              </p>

              {/* STATS */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-[#dbe2f3] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">
                      Total Sprints
                    </span>

                    <FolderKanban className="h-5 w-5 text-[#7189D0]" />
                  </div>

                  <h2 className="mt-4 text-4xl font-black text-[#111827]">
                    {sprints.length}
                  </h2>
                </div>

                <div className="rounded-3xl border border-[#dbe2f3] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">
                      Active
                    </span>

                    <Activity className="h-5 w-5 text-green-600" />
                  </div>

                  <h2 className="mt-4 text-4xl font-black text-[#111827]">
                    {sprints.filter((s: any) => s.status === "ACTIVE").length}
                  </h2>
                </div>

                <div className="rounded-3xl border border-[#dbe2f3] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">
                      Completed
                    </span>

                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  </div>

                  <h2 className="mt-4 text-4xl font-black text-[#111827]">
                    {
                      sprints.filter((s: any) => s.status === "COMPLETED")
                        .length
                    }
                  </h2>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col gap-4 sm:flex-row xl:flex-col">
              <Button
                onClick={() =>
                  router.push(`/tasks/${projectId}?sprintId=${activeSprintid}`)
                }
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#7189D0] px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                <FolderKanban className="h-4 w-4" />
                Open Active Board
              </Button>

              <Button
                onClick={() => router.push(`/sprint/${projectId}/backlog`)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[#dbe2f3] bg-white px-6 py-4 text-sm font-semibold text-[#111827] transition hover:bg-[#f8faff]"
              >
                Backlog Tasks
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ========================= */}
        {/* CREATE SPRINT */}
        {/* ========================= */}

        <div className="mt-8 rounded-[32px] border border-[#dbe2f3] bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#7189D0] text-white shadow-lg">
              <Plus className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
                Create New Sprint
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Define sprint scope, timeline and delivery goals
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Sprint Name
              </label>

              <input
                placeholder="Sprint Alpha"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-[#dbe2f3] bg-[#f8faff] px-5 py-4 outline-none transition focus:border-[#7189D0] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Sprint Goal
              </label>

              <input
                placeholder="Improve onboarding flow"
                value={form.goal}
                onChange={(e) =>
                  setForm({
                    ...form,
                    goal: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-[#dbe2f3] bg-[#f8faff] px-5 py-4 outline-none transition focus:border-[#7189D0] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
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
                className="w-full rounded-2xl border border-[#dbe2f3] bg-[#f8faff] px-5 py-4 outline-none transition focus:border-[#7189D0] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
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
                className="w-full rounded-2xl border border-[#dbe2f3] bg-[#f8faff] px-5 py-4 outline-none transition focus:border-[#7189D0] focus:bg-white"
              />
            </div>
          </div>

          <Button
            onClick={() => createSprintMutation.mutate()}
            disabled={createSprintMutation.isPending}
            className="mt-8 flex items-center gap-2 rounded-2xl bg-[#7189D0] px-7 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {createSprintMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Sprint...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Sprint
              </>
            )}
          </Button>
        </div>

        {/* ========================= */}
        {/* FILTERS */}
        {/* ========================= */}

        <div className="mt-8 rounded-[30px] border border-[#dbe2f3] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-3xl font-bold tracking-tight text-[#111827]">
              All Sprints
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Monitor sprint lifecycle, active progress and timelines
            </p>
          </div>

          <SprintFilter filters={filters} setFilters={setFilters} />
        </div>

        {/* ========================= */}
        {/* SPRINTS */}
        {/* ========================= */}

        <div className="mt-8">
          {isLoading ? (
            <SprintPageSkeleton />
          ) : (
            <>
              {sprints.length > 0 ? (
                <div className="grid gap-7 xl:grid-cols-2">
                  {sprints.map((sprint: any) => {
                    const isActive = sprint.status === "ACTIVE";

                    const isCompleted = sprint.status === "COMPLETED";

                    const isPlanned = sprint.status === "PLANNED";

                    return (
                      <div
                        key={sprint.id}
                        className="group overflow-hidden cursor-pointer rounded-[34px] border border-[#dbe2f3] bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        onClick={() =>
                          sprint?.status === "ACTIVE" &&
                          router.push(
                            `/tasks/${projectId}?sprintId=${sprint.id}`,
                          )
                        }
                      >
                        {/* HEADER */}
                        <div className="mb-7 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div
                              className={`mb-4 inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${
                                isActive
                                  ? "bg-green-100 text-green-700"
                                  : isCompleted
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {sprint.status}
                            </div>

                            <h2 className="text-3xl font-black tracking-tight text-[#111827]">
                              {sprint.name}
                            </h2>

                            <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-500">
                              {sprint.goal || "No sprint goal defined yet"}
                            </p>
                          </div>

                          <Button
                            onClick={() =>
                              deleteSprintMutation.mutate(sprint.id)
                            }
                            disabled={deleteSprintMutation.isPending}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* INFO */}
                        <div className="grid gap-5 md:grid-cols-2">
                          {/* TIMELINE */}
                          <div className="rounded-3xl border border-[#dbe2f3] bg-[#f8faff] p-5">
                            <div className="mb-4 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                                <CalendarDays className="h-4 w-4 text-[#7189D0]" />
                              </div>

                              <div>
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                  Timeline
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-semibold text-[#111827]">
                                {sprint.startDate
                                  ? new Date(
                                      sprint.startDate,
                                    ).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "--"}
                              </div>

                              <div className="text-xs text-slate-400">
                                Ends on{" "}
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

                          {/* TASKS */}
                          <div className="rounded-3xl border border-[#dbe2f3] bg-[#f8faff] p-5">
                            <div className="mb-4 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                                <Target className="h-4 w-4 text-[#7189D0]" />
                              </div>

                              <div>
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                  Tasks
                                </div>
                              </div>
                            </div>

                            <div className="text-4xl font-black tracking-tight text-[#111827]">
                              {sprint.tasks.length || 0}
                            </div>

                            <div className="mt-2 text-xs text-slate-400">
                              Tasks assigned in this sprint
                            </div>
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="mt-8 border-t border-[#eef2fb] pt-6">
                          <div className="flex flex-wrap gap-3">
                            {isPlanned && (
                              <Button
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
                              </Button>
                            )}

                            {isActive && (
                              <Button
                                onClick={() =>
                                  completeSprintMutation.mutate(sprint.id)
                                }
                                disabled={completeSprintMutation.isPending}
                                className="flex items-center gap-2 rounded-2xl bg-[#7189D0] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                              >
                                {completeSprintMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                                Complete Sprint
                              </Button>
                            )}

                            {!isCompleted && (
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/tasks/${projectId}?sprintId=${sprint.id}`,
                                  )
                                }
                                className="rounded-2xl border border-[#dbe2f3] bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#f8faff]"
                              >
                                Open Board
                              </Button>
                            )}

                            {isActive && (
                              <Button
                                onClick={() =>
                                  router.push(`/sprint/${sprint.id}/dashboard`)
                                }
                                className="rounded-2xl border border-[#dbe2f3] bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#f8faff]"
                              >
                                Analytics
                              </Button>
                            )}

                            {!isCompleted && (
                              <CreateTaskModal
                                projectId={projectId}
                                sprintId={sprint.id}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[36px] border border-dashed border-[#cdd7ef] bg-white py-28 text-center shadow-sm">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#f3f6ff]">
                    <Clock3 className="h-10 w-10 text-[#7189D0]" />
                  </div>

                  <h2 className="mt-7 text-4xl font-black tracking-tight text-[#111827]">
                    No Sprints Yet
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-8 text-slate-500">
                    Create your first sprint to start planning tasks, organizing
                    work and managing agile delivery for your project team.
                  </p>

                  <Button
                    onClick={() =>
                      document.querySelector("input")?.scrollIntoView({
                        behavior: "smooth",
                      })
                    }
                    className="mt-8 rounded-2xl bg-[#7189D0] px-7 py-4 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Create First Sprint
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
