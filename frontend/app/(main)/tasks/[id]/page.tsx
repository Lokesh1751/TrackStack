"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  getProjectTasks,
  updateTaskStatus,
  getProjectMembers,
  getCurrentUser,
} from "@/lib/api";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { MessageSquare } from "lucide-react";
import { getTaskTypeIcon } from "@/helpers";

import { toast } from "sonner";
import { TaskBoardSkeleton } from "@/components/skeleton/taskBoard";
import { TaskModalSkeleton } from "@/components/skeleton/task-edit-modal";
import { CreateTaskModal } from "@/components/modals/createTask";
import { TaskModal } from "@/components/modals/taskModal";
import { useDebounce } from "@/hooks/useDebounce";
import { TaskFilter } from "@/components/filters/TaskFilter";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export default function Page() {
  const { id } = useParams();

  const projectId = id as string;
  const searchParams = useSearchParams();
  const router = useRouter();

  const sprintId = searchParams.get("sprint");
  const queryClient = useQueryClient();

  const [selectedTask, setSelectedTask] = useState<any>(null);
  // =========================
  // QUERY FILTERS
  // =========================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const debouncedSearch = useDebounce(search, 500);

  // =========================
  // CURRENT USER
  // =========================

  const { data: currentUserData } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
  });

  const currentUser = currentUserData?.data;
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    currentUser?.id,
  );

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

  // =========================
  // GET TASKS
  // =========================

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "tasks",
      projectId,
      selectedUserId,
      sprintId,
      debouncedSearch,
      statusFilter,
      priorityFilter,
      typeFilter,
    ],

    queryFn: () =>
      getProjectTasks(
        projectId,
        selectedUserId ? selectedUserId : undefined,
        sprintId || undefined,
        {
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          type: typeFilter || undefined,
        },
      ),

    enabled: !!currentUser?.id,
  });

  const tasks = data?.tasks || [];

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

    // =========================
    // OPTIMISTIC UPDATE
    // =========================

    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({
        queryKey: ["tasks", projectId],
      });

      const previousTasks = queryClient.getQueryData([
        "tasks",
        projectId,
        selectedUserId,
        sprintId,
        debouncedSearch,
        statusFilter,
        priorityFilter,
        typeFilter,
      ]);

      queryClient.setQueryData(
        [
          "tasks",
          projectId,
          selectedUserId,
          sprintId,
          debouncedSearch,
          statusFilter,
          priorityFilter,
          typeFilter,
        ],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            tasks: old.tasks.map((task: any) =>
              task.id === taskId
                ? {
                    ...task,
                    status,
                  }
                : task,
            ),
          };
        },
      );

      return { previousTasks };
    },

    // =========================
    // ROLLBACK IF FAILED
    // =========================

    onError: (_error, _variables, context) => {
      queryClient.setQueryData(
        [
          "tasks",
          projectId,
          selectedUserId,
          sprintId,
          debouncedSearch,
          statusFilter,
          priorityFilter,
          typeFilter,
        ],
        context?.previousTasks,
      );

      toast.error("Failed to update task status");
    },

    // =========================
    // REFETCH
    // =========================

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", projectId],
      });
    },
  });

  // =========================
  // DRAG & DROP
  // =========================

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // dropped outside
    if (!destination) return;

    // same column
    if (destination.droppableId === source.droppableId) return;

    updateStatusMutation.mutate({
      taskId: draggableId,
      status: destination.droppableId,
    });
  };

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

  function typeIcon(type: any) {
    getTaskTypeIcon(type);
  }

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
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-100 p-6">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-neutral-100 pb-4">
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
              onClick={() => router.push(`/sprint/${sprintId}/dashboard`)}
              className="rounded-xl border px-4 py-2 text-sm cursor-pointer"
            >
              Analysis
            </button>
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
      </div>

      {/* TASK BOARD (UNCHANGED) */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
          <TaskBoardSkeleton />
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              {statuses.map((status) => (
                <Droppable droppableId={status} key={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`rounded-3xl p-4 shadow-sm transition ${
                        snapshot.isDraggingOver ? "bg-neutral-200" : "bg-white"
                      }`}
                    >
                      {/* HEADER */}
                      <div className="mb-5 flex items-center justify-between">
                        <h2 className="font-semibold">{status}</h2>

                        <div className="rounded-full bg-neutral-200 px-3 py-1 text-xs">
                          {groupedTasks[status]?.length || 0}
                        </div>
                      </div>

                      {/* TASKS */}
                      <div className="space-y-4 min-h-[200px]">
                        {groupedTasks[status]?.map(
                          (task: any, index: number) => (
                            <Draggable
                              draggableId={task.id}
                              index={index}
                              key={task.id}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => openTask(task)}
                                  className={`group cursor-pointer rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-black hover:shadow-xl ${
                                    snapshot.isDragging
                                      ? "rotate-1 shadow-2xl"
                                      : ""
                                  }`}
                                >
                                  {/* TOP */}
                                  <div className="mb-4 flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-xs font-semibold tracking-wide text-neutral-400">
                                        <span className="flex gap-2">
                                          {task.taskKey}{" "}
                                          {getTaskTypeIcon(task.type)}
                                        </span>
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
                                        {new Date(
                                          task.dueDate,
                                        ).toLocaleDateString("en-IN", {
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
                                        {task.assignee?.email
                                          ?.charAt(0)
                                          ?.toUpperCase() || "U"}
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

                                  {/* BOTTOM */}
                                  <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
                                    <div>
                                      Created{" "}
                                      {new Date(
                                        task.createdAt,
                                      ).toLocaleDateString("en-IN")}
                                    </div>

                                    {task.commentsCount !== undefined && (
                                      <div className="flex items-center gap-1">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        {task.commentsCount}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ),
                        )}

                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

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
              setSelectedTask={setSelectedTask}
            />
          )}
        </>
      )}
    </div>
  );
}
