
"use client";
export const dynamic = "force-dynamic";
import { useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  getProjectTasks,
  updateTaskStatus,
  getProjectMembers,
  getCurrentUser,
} from "@/lib/api";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { TaskBoardSkeleton } from "@/components/skeleton/taskBoard";
import { TaskModalSkeleton } from "@/components/skeleton/task-edit-modal";
import { CreateTaskModal } from "@/components/modals/createTask";
import { TaskModal } from "@/components/modals/taskModal";
import { useDebounce } from "@/hooks/useDebounce";
import { TaskFilter } from "@/components/filters/TaskFilter";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { TaskCard } from "@/components/task-card";
import { Suspense } from "react";

const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export default function Page() {
  const { id } = useParams();

  const projectId = id as string;
  const searchParams = useSearchParams();
  const router = useRouter();

  const sprintId = searchParams.get("sprint");
  const taskId = searchParams.get("taskId");
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

  const { data: currentUserData, isLoading: isCurrentUserLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
  });

  const currentUser = currentUserData?.data;
  const [selectedUserId, setSelectedUserId] = useState<string | null>("");

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

  useEffect(() => {
    if (!taskId || !tasks.length) return;

    const task = tasks.find((t: any) => t.id === taskId);

    if (task) {
      setSelectedTask(task);
    }
  }, [taskId, tasks]);

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

    const params = new URLSearchParams(searchParams.toString());

    params.set("taskId", task.id);

    router.push(`?${params.toString()}`);
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
  const currentSprint = tasks?.find(
    (t: any) => t?.sprint?.id === sprintId,
  )?.sprint;

  if (sprintId === "undefined") {
    return (
      <Suspense fallback={null}>
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
              className="mt-6 w-full rounded-2xl bg-[#7189D0] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Make Any Sprint Active
            </button>

            <button
              onClick={() => router.push(`/sprint/${projectId}/backlog`)}
              className="mt-6 w-full rounded-2xl bg-[#7189D0] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Backlogs
            </button>
          </div>
        </div>
      </Suspense>
    );
  }
  if (isLoading || isCurrentUserLoading) {
    return <TaskBoardSkeleton />;
  }
  return (
    <Suspense fallback={null}>
      <div className="flex h-screen flex-col overflow-hidden bg-neutral-100 p-6">
        {/* HEADER */}
        <div className="sticky top-0 z-20 bg-neutral-100 pb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Tasks Board for {currentSprint?.name}{" "}
                {currentSprint?.description}
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
        {/* TASK BOARD */}
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
                      {groupedTasks[status]?.map((task: any, index: number) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onOpen={openTask}
                        />
                      ))}

                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
        {selectedTask && (
          <>
            {isLoading ? (
              <TaskModalSkeleton />
            ) : (
              <TaskModal
                task={selectedTask}
                projectId={projectId}
                sprintId={sprintId}
                onClose={() => {
                  setSelectedTask(null);

                  const params = new URLSearchParams(searchParams.toString());

                  params.delete("taskId");

                  router.push(`?${params.toString()}`);
                }}
                refetch={refetch}
                setSelectedTask={setSelectedTask}
              />
            )}
          </>
        )}
      </div>
    </Suspense>
  );
}
