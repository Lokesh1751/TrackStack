"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  createTask,
  getProjectTasks,
  updateTaskStatus,
  deleteTask,
  assignTask,
  addTaskComment,
  getTaskComments,
  updateTask,
  getProjectMembers,
  deleteComment,
  getCurrentUser,
  addTaskToSprint,
  removeTaskFromSprint,
} from "@/lib/api";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Loader2, Trash2, Plus, MessageSquare } from "lucide-react";

import { toast } from "sonner";
import { TaskBoardSkeleton } from "@/components/skeleton/taskBoard";
import { TaskModalSkeleton } from "@/components/skeleton/task-edit-modal";
import { CreateTaskModal } from "@/components/modals/createTask";

const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export default function Page() {
  const { id } = useParams();

  const projectId = id as string;
  const searchParams = useSearchParams();
  const router = useRouter();

  const sprintId = searchParams.get("sprint");
  console.log("sprintId", sprintId);
  const queryClient = useQueryClient();

  const [selectedTask, setSelectedTask] = useState<any>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    type: "TASK",
    estimateMinutes: 60,
    dueDate: "",
  });

  // =========================
  // CURRENT USER
  // =========================

  const { data: currentUserData } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
  });

  const currentUser = currentUserData?.data;
  console.log("currentUser", currentUser);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    currentUser?.id,
  );
  console.log("selectedUserId", currentUser);

  // =========================
  // MEMBERS
  // =========================

  const { data: membersData } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: !!projectId,
  });

  const members = membersData?.members || [];

  // =========================
  // GET TASKS
  // =========================

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tasks", projectId, selectedUserId, sprintId],
    queryFn: () =>
      getProjectTasks(
        projectId,
        selectedUserId ? selectedUserId : undefined,
        sprintId || undefined,
      ),
    enabled: !!currentUser?.id,
  });

  const tasks = data?.tasks || [];

  // =========================
  // CREATE TASK
  // =========================

  const createTaskMutation = useMutation({
    mutationFn: () =>
      createTask(projectId, {
        ...form,
        sprintId: sprintId || undefined,
        dueDate: form.dueDate
          ? new Date(form.dueDate).toISOString()
          : undefined,
      }),
    onSuccess: () => {
      toast.success("Task created");

      setForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        type: "TASK",
        estimateMinutes: 60,
        dueDate: "",
      });

      queryClient.invalidateQueries({
        queryKey: ["tasks", projectId],
      });
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // GROUP TASKS
  // =========================

  const groupedTasks = useMemo(() => {
    return statuses.reduce(
      (acc: any, status) => {
        acc[status] = tasks.filter((task: any) => task.status === status);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }, [tasks]);

  // =========================
  // UPDATE STATUS
  // =========================

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      updateTaskStatus(taskId, { status }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", projectId],
      });
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // OPEN TASK
  // =========================

  const openTask = (task: any) => {
    setSelectedTask(task);
  };
  const formatEstimate = (minutes?: number) => {
    const totalMinutes = minutes || 0;

    const hours = totalMinutes / 60;

    // 8h = 1d
    if (hours >= 8) {
      const days = hours / 8;

      return `${Number.isInteger(days) ? days : days.toFixed(1)}d`;
    }

    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
  };
  const currentSprint = tasks?.find((t: any) => t?.sprint?.id === sprintId)
    ?.sprint?.name;

  if (sprintId === "undefined") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          {/* ICON */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-3xl">
            !
          </div>

          {/* TITLE */}
          <h2 className="text-2xl font-bold text-neutral-900">
            No Active Sprint
          </h2>

          {/* DESC */}
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            There is currently no active sprint for this project. Activate a
            sprint to start managing tasks on the board.
          </p>

          {/* BUTTON */}
          <button
            onClick={() => router.push(`/sprint/${projectId}`)}
            className="mt-6 w-full rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Make Any Sprint Active
          </button>

          <button
            onClick={() => router.push(`/sprint/${projectId}/backlog`)}
            className="mt-6 w-full rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Backlogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Tasks Board for {currentSprint}
          </h1>

          <p className="mt-1 text-sm text-neutral-500">
            Manage project tasks like Jira
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/sprint/${projectId}/backlog`)}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Backlogs
          </button>

          <CreateTaskModal
            projectId={projectId}
            sprintId={sprintId || undefined}
          />
        </div>
      </div>

      {/* USER FILTER */}
      <div className="mt-6 mb-3 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* LEFT */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Filter Tasks
            </h3>

            <p className="mt-1 text-sm text-neutral-500">
              View tasks assigned to a specific member or entire project
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* SELECT */}
            <div className="relative">
              <select
                value={selectedUserId || "ALL"}
                onChange={(e) =>
                  setSelectedUserId(
                    e.target.value === "ALL" ? null : e.target.value,
                  )
                }
                className="min-w-[280px] appearance-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 pr-10 text-sm font-medium text-neutral-700 outline-none transition focus:border-black focus:bg-white"
              >
                {/* ALL TASKS */}
                <option value="ALL">👥 All Project Tasks</option>

                {/* CURRENT USER */}
                <option value={currentUser ? currentUser.id : undefined}>
                  🙋 My Tasks ({currentUser && currentUser.email})
                </option>
                {/* MEMBERS */}
                {members
                  .filter((m: any) => m.userId !== currentUser?.id)
                  .map((m: any) => (
                    <option key={m.userId} value={m.userId}>
                      👤 {m.email}
                    </option>
                  ))}
              </select>

              {/* DROPDOWN ICON */}
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                ▼
              </div>
            </div>

            {/* TASK COUNT */}
            <div className="flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white shadow-sm">
              <div className="h-2 w-2 rounded-full bg-green-400" />

              <span>
                {tasks.length} Task{tasks.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVE FILTER */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Active Filter:
          </div>

          <div className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">
            {selectedUserId
              ? members.find((m: any) => m.userId === selectedUserId)?.email ||
                currentUser?.email
              : "All Project Tasks"}
          </div>
        </div>
      </div>

      {/* TASK BOARD (UNCHANGED) */}
      {isLoading ? (
        <TaskBoardSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {statuses.map((status) => (
            <div key={status} className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold">{status}</h2>
                <div className="rounded-full bg-neutral-200 px-3 py-1 text-xs">
                  {groupedTasks[status]?.length || 0}
                </div>
              </div>

              <div className="space-y-4">
                {groupedTasks[status]?.map((task: any) => (
                  <div
                    key={task.id}
                    onClick={() => openTask(task)}
                    className="group cursor-pointer rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-black hover:shadow-xl"
                  >
                    {/* TOP */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold tracking-wide text-neutral-400">
                          {task.taskKey}
                        </div>

                        <h3 className="mt-1 line-clamp-2 text-lg font-bold text-neutral-900">
                          {task.title}
                        </h3>
                      </div>

                      <div
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
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
                    </div>

                    {/* DESCRIPTION */}
                    <p className="line-clamp-3 text-sm leading-6 text-neutral-500">
                      {task.description || "No description added"}
                    </p>

                    {/* META */}
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                        {task.type}
                      </div>

                      <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                        {formatEstimate(task.estimateMinutes)}
                      </div>

                      {task.dueDate && (
                        <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                          Due{" "}
                          {new Date(task.dueDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      )}
                    </div>

                    {/* FOOTER */}
                    <div className="mt-6 flex flex-col gap-3 justify-between border-t border-neutral-100 pt-4">
                      {/* ASSIGNEE */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                          {task.assignee?.email?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </div>

                        <div>
                          <div className="text-sm font-medium text-neutral-800">
                            {task.assignee?.email || "Unassigned"}
                          </div>

                          <div className="text-xs text-neutral-400">
                            Assigned User
                          </div>
                        </div>
                      </div>

                      {/* STATUS */}
                      <div>
                        <select
                          value={task.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();

                            updateStatusMutation.mutate({
                              taskId: task.id,
                              status: e.target.value,
                            });
                          }}
                          className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium outline-none transition focus:border-black"
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* BOTTOM STRIP */}
                    <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
                      <div>
                        Created{" "}
                        {new Date(task.createdAt).toLocaleDateString("en-IN")}
                      </div>

                      {task.commentsCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {task.commentsCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <>
          {isLoading ? (
            <TaskModalSkeleton />
          ) : (
            <TaskModal
              task={selectedTask}
              projectId={projectId}
              onClose={() => setSelectedTask(null)}
              refetch={refetch}
            />
          )}
        </>
      )}
    </div>
  );
}

// ======================================================
// TASK MODAL
// ======================================================

function TaskModal({ task, projectId, onClose, refetch }: any) {
  const queryClient = useQueryClient();

  const [comment, setComment] = useState("");

  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    estimateMinutes: task.estimateMinutes || 0,
  });

  // =========================
  // GET COMMENTS
  // =========================

  const { data: commentsData } = useQuery({
    queryKey: ["comments", task.id],
    queryFn: () => getTaskComments(task.id),
  });

  const comments = commentsData?.comments || [];

  // =========================
  // GET MEMBERS
  // =========================

  const { data: userData } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
  });

  const currentUser = userData?.data;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    currentUser?.id,
  );

  const { data: membersData } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => getProjectMembers(projectId),
  });

  const members = membersData?.members || [];

  // =========================
  // UPDATE TASK
  // =========================

  const updateTaskMutation = useMutation({
    mutationFn: () => updateTask(task.id, editForm),

    onSuccess: () => {
      toast.success("Task updated");

      queryClient.invalidateQueries({
        queryKey: ["tasks", projectId],
      });

      refetch();
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // ASSIGN TASK
  // =========================

  const assignTaskMutation = useMutation({
    mutationFn: (assigneeId: string) => assignTask(task.id, assigneeId),

    onSuccess: () => {
      toast.success("Task assigned");

      queryClient.invalidateQueries({
        queryKey: ["tasks", projectId],
      });

      refetch();
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // ADD COMMENT
  // =========================

  const addCommentMutation = useMutation({
    mutationFn: () =>
      addTaskComment(task.id, {
        content: comment,
      }),

    onSuccess: () => {
      setComment("");

      queryClient.invalidateQueries({
        queryKey: ["comments", task.id],
      });

      toast.success("Comment added");
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // DELETE TASK
  // =========================

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(task.id),

    onSuccess: () => {
      toast.success("Task deleted");

      queryClient.invalidateQueries({
        queryKey: ["tasks", projectId],
      });

      onClose();
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),

    onSuccess: () => {
      toast.success("Comment deleted");

      queryClient.invalidateQueries({
        queryKey: ["comments", task.id],
      });
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });
  const formatEstimate = (minutes?: number) => {
    const totalMinutes = minutes || 0;

    const hours = totalMinutes / 60;

    // 8h = 1d
    if (hours >= 8) {
      const days = hours / 8;

      return `${Number.isInteger(days) ? days : days.toFixed(1)}d`;
    }

    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
  };
  const { data: userDataa } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
  });
  const isSuperAdmin = userDataa?.data?.isSuperAdmin;
  const isAdmin = userDataa?.data?.role === "ADMIN";

  const addToSprintMutation = useMutation({
    mutationFn: (sprintId: string) => addTaskToSprint(sprintId, task.id),

    onSuccess: () => {
      toast.success("Task added to sprint");

      queryClient.invalidateQueries({
        queryKey: ["tasks", projectId],
      });

      refetch();
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const removeFromSprintMutation = useMutation({
    mutationFn: () => removeTaskFromSprint(task.id),

    onSuccess: () => {
      toast.success("Task removed from sprint");

      queryClient.invalidateQueries({
        queryKey: ["tasks", projectId],
      });

      refetch();
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl">
        {/* HEADER */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="mb-2 text-sm text-neutral-500">{task.taskKey}</div>

            <h2 className="text-3xl font-bold">{task.title}</h2>
          </div>

          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Close
          </button>
        </div>

        <div className="mt-4 rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-700">
                Sprint Assignment
              </p>

              <p className="text-xs text-neutral-500">
                {task.sprint ? task.sprint.name : "Not assigned to sprint"}
              </p>
            </div>

            {task.sprint && (
              <button
                onClick={() => removeFromSprintMutation.mutate()}
                className="rounded-xl bg-black px-4 py-2 text-sm text-white"
              >
                Move to Backlog
              </button>
            )}
          </div>
        </div>
        <div>Sprint: {task.sprint.name}</div>
        {/* EDIT */}
        <div className="rounded-3xl border bg-neutral-50 p-5">
          <h3 className="mb-5 text-lg font-semibold">Task Details</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={editForm.title}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  title: e.target.value,
                })
              }
              className="rounded-2xl border bg-white p-3"
            />

            <select
              value={editForm.priority}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  priority: e.target.value,
                })
              }
              className="rounded-2xl border bg-white p-3"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-600">
              Estimate
            </label>

            <div className="relative">
              <input
                type="number"
                value={editForm.estimateMinutes}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    estimateMinutes: Number(e.target.value),
                  })
                }
                className="w-full rounded-2xl border border-neutral-200 bg-white p-3 pr-20 outline-none transition focus:border-black"
                placeholder="Minutes"
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                {formatEstimate(editForm.estimateMinutes)}
              </div>
            </div>

            <div className="mt-2 text-xs text-neutral-400">
              8h = 1d industry standard
            </div>
          </div>

          <textarea
            rows={5}
            value={editForm.description}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                description: e.target.value,
              })
            }
            className="mt-4 w-full rounded-2xl border bg-white p-4"
          />

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => updateTaskMutation.mutate()}
              disabled={updateTaskMutation.isPending}
              className="flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-white"
            >
              {updateTaskMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Update Task
            </button>

            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-white"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          </div>
        </div>

        {/* ASSIGN */}
        <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-neutral-900">
                Assign Task
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                Assign this task to a project member
              </p>
            </div>

            {task.assignee && (
              <div className="rounded-2xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">
                Current: {task.assignee.email}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            {/* SELECT USER */}
            <div className="relative flex-1">
              <select
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 pr-10 text-sm font-medium text-neutral-700 outline-none transition focus:border-black focus:bg-white"
              >
                <option value="">Select team member</option>

                {members.map((member: any) => (
                  <option key={member.userId} value={member.userId}>
                    {member.email} ({member.role})
                  </option>
                ))}
              </select>

              {/* DROPDOWN ICON */}
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                ▼
              </div>
            </div>

            {/* ASSIGN BUTTON */}
            <button
              onClick={() => {
                if (!selectedUserId) {
                  toast.error("Please select a member");
                  return;
                }

                assignTaskMutation.mutate(selectedUserId);
              }}
              disabled={assignTaskMutation.isPending || !selectedUserId}
              className="flex min-w-[180px] items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assignTaskMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Assign Task
                </>
              )}
            </button>
          </div>

          {/* MEMBER PREVIEW */}
          <div className="mt-5 flex flex-wrap gap-2">
            {members.slice(0, 5).map((member: any) => (
              <div
                key={member.userId}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
                  selectedUserId === member.userId
                    ? "border-black bg-black text-white"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600"
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    selectedUserId === member.userId
                      ? "bg-white text-black"
                      : "bg-black text-white"
                  }`}
                >
                  {member.email?.charAt(0)?.toUpperCase()}
                </div>

                {member.email}
              </div>
            ))}
          </div>
        </div>

        {/* COMMENTS */}
        <div className="mt-6 rounded-3xl border bg-neutral-50 p-5">
          <div className="mb-5 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />

            <h3 className="text-lg font-semibold">Comments</h3>
          </div>

          <div className="space-y-4">
            {comments.map((comment: any) => (
              <div key={comment.id} className="rounded-2xl bg-white p-4">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {comment.user.email}
                  </div>

                  {/* ONLY OWNER CAN DELETE */}
                  {(comment.userId === currentUser?.id ||
                    isSuperAdmin ||
                    isAdmin) && (
                    <button
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      disabled={deleteCommentMutation.isPending}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      {deleteCommentMutation.isPending
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  )}
                </div>

                <div className="text-sm text-neutral-700">
                  {comment.content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write comment..."
              className="flex-1 rounded-2xl border bg-white p-3"
            />

            <button
              onClick={() => addCommentMutation.mutate()}
              disabled={addCommentMutation.isPending}
              className="flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-white"
            >
              {addCommentMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
