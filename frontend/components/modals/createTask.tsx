"use client";

import {useState } from "react";

import { createPortal } from "react-dom";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Loader2, Plus } from "lucide-react";

import { toast } from "sonner";

import { createTask, getProjectMembers } from "@/lib/api";

type Props = {
  projectId: string;
  sprintId?: string;
};

export function CreateTaskModal({ projectId, sprintId }: Props) {
  const queryClient = useQueryClient();


  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    type: "TASK",
    estimateMinutes: 60,
    dueDate: "",
    assigneeId: "",
  });

  // =========================
  // MEMBERS
  // =========================

  const { data: membersData } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: open,
  });

  const members = membersData?.members || [];

  // =========================
  // CREATE TASK
  // =========================

  const createTaskMutation = useMutation({
    mutationFn: () =>
      createTask(projectId, {
        ...form,
        sprintId: sprintId || undefined,
        assigneeId: form.assigneeId || undefined,
        dueDate: form.dueDate
          ? new Date(form.dueDate).toISOString()
          : undefined,
      }),

    onSuccess: () => {
      toast.success("Task created");

      queryClient.invalidateQueries({
        queryKey: ["tasks", projectId],
      });

      queryClient.invalidateQueries({
        queryKey: ["backlog", projectId],
      });

      setForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        type: "TASK",
        estimateMinutes: 60,
        dueDate: "",
        assigneeId: "",
      });

      setOpen(false);
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <>
      {/* OPEN BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Create Task
      </button>

      {/* MODAL */}
      {typeof window !== "undefined" &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
              {/* HEADER */}
              <div className="border-b px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900">
                      Create New Task
                    </h2>

                    <p className="mt-1 text-sm text-neutral-500">
                      Add a new task to your project
                    </p>
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-xl border px-4 py-2 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* BODY */}
              <div className="space-y-6 p-6">
                {/* TITLE */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Task Title
                  </label>

                  <input
                    placeholder="Enter task title"
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-neutral-200 bg-white p-4 outline-none transition focus:border-black"
                  />
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Description
                  </label>

                  <textarea
                    rows={5}
                    placeholder="Describe task..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    className="w-full resize-none rounded-2xl border border-neutral-200 bg-white p-4 outline-none transition focus:border-black"
                  />
                </div>

                {/* GRID */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* PRIORITY */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      Priority
                    </label>

                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          priority: e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-neutral-200 bg-white p-4 outline-none transition focus:border-black"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>

                  {/* TYPE */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      Task Type
                    </label>

                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          type: e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-neutral-200 bg-white p-4 outline-none transition focus:border-black"
                    >
                      <option value="STORY">STORY</option>
                      <option value="TASK">TASK</option>
                      <option value="SUBTASK">SUBTASK</option>
                      <option value="EPIC">EPIC</option>
                      <option value="IMPROVEMENT">IMPROVEMENT</option>
                    </select>
                  </div>

                  {/* ESTIMATE */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      Estimate Minutes
                    </label>

                    <input
                      type="number"
                      value={form.estimateMinutes}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          estimateMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-2xl border border-neutral-200 bg-white p-4 outline-none transition focus:border-black"
                    />
                  </div>

                  {/* DUE DATE */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      Due Date
                    </label>

                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dueDate: e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-neutral-200 bg-white p-4 outline-none transition focus:border-black"
                    />
                  </div>
                </div>

                {/* ASSIGNEE */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Assign Member
                  </label>

                  <select
                    value={form.assigneeId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        assigneeId: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-neutral-200 bg-white p-4 outline-none transition focus:border-black"
                  >
                    <option value="">Unassigned</option>

                    {members.map((member: any) => (
                      <option key={member.userId} value={member.userId}>
                        {member.email} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-end gap-3 border-t px-6 py-5">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border px-5 py-3 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  disabled={!form.title || createTaskMutation.isPending}
                  onClick={() => createTaskMutation.mutate()}
                  className="flex items-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {createTaskMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {createTaskMutation.isPending
                    ? "Creating..."
                    : "Create Task"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}