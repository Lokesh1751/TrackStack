"use client";

import { MessageSquare } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";

import { getTaskTypeIcon } from "@/helpers";

interface TaskCardProps {
  task: any;
  index: number;
  onOpen: (task: any) => void;
}

export function TaskCard({ task, index, onOpen }: TaskCardProps) {
  const formatEstimate = (minutes?: number) => {
    const totalMinutes = minutes || 0;

    const hours = totalMinutes / 60;

    if (hours >= 8) {
      const days = hours / 8;

      return `${Number.isInteger(days) ? days : days.toFixed(1)}d`;
    }

    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpen(task)}
          className={`group cursor-pointer rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-black hover:shadow-xl ${
            snapshot.isDragging ? "rotate-1 shadow-2xl" : ""
          }`}
        >
          {/* TOP */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-wide text-neutral-400">
                <span className="flex gap-2">
                  {task.taskKey}
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
                {new Date(task.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="mt-6 flex flex-col gap-3 justify-between border-t border-neutral-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                {task.assignee?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div>
                <div className="text-sm font-medium text-neutral-800">
                  {task.assignee?.email || "Unassigned"}
                </div>

                <div className="text-xs text-neutral-400">Assigned User</div>
              </div>
            </div>
          </div>

          {/* BOTTOM */}
          <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
            <div>
              Created {new Date(task.createdAt).toLocaleDateString("en-IN")}
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
  );
}
