"use client";

import { useState } from "react";
import {
  getProjectTasks,
  deleteTask,
  assignTask,
  addTaskComment,
  getTaskComments,
  updateTask,
  getProjectMembers,
  deleteComment,
  getCurrentUser,
  removeTaskFromSprint,
  getTaskById,
  deleteTaskLink,
  createTaskLink,
  updateTaskLink,
  editComment,
} from "@/lib/api";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MentionsInput, Mention } from "react-mentions";

import { Loader2, MessageSquare, Link2 } from "lucide-react";
import { getTaskTypeIcon } from "@/helpers";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function TaskModal({
  task,
  projectId,
  sprintId,
  onClose,
  refetch,
  setSelectedTask,
}: any) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [comment, setComment] = useState("");

  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    estimateMinutes: task.estimateMinutes || 0,
    type: task.type,
    dueDate: task.dueDate,
  });

  // =========================
  // TASK LINK FORM
  // =========================

  const [selectedLinkedTaskId, setSelectedLinkedTaskId] = useState("");
  const [selectedLinkType, setSelectedLinkType] = useState("BLOCKS");

  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingLinkType, setEditingLinkType] = useState("BLOCKS");

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const [editingComment, setEditingComment] = useState("");

  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const [replyContent, setReplyContent] = useState("");

  const searchParams = useSearchParams();

  const commentIdFromUrl = searchParams.get("commentId");
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // =========================
  // GET PROJECT TASKS
  // =========================

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => getProjectTasks(projectId),
  });

  const availableTasks =
    tasksData?.tasks?.filter((t: any) => t.id !== task.id) || [];

  // =========================
  // GET TASK DETAILS
  // =========================

  const {
    data: taskDetailsData,
    refetch: refetchTaskDetails,
    isLoading: taskDetailsLoading,
  } = useQuery({
    queryKey: ["task", task.id],
    queryFn: () => getTaskById(task.id),
  });

  const taskData = taskDetailsData?.task || task;

  // =========================
  // GET COMMENTS
  // =========================

  const { data: commentsData } = useQuery({
    queryKey: ["comments", task.id],
    queryFn: () => getTaskComments(task.id),
  });

  const comments = commentsData?.comments || [];

  useEffect(() => {
    if (!commentIdFromUrl || !comments.length) return;

    const el = commentRefs.current[commentIdFromUrl];

    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });

      el.classList.add("bg-[#DCE2F6]");
      el.classList.add("ring-1");
      el.classList.add("ring-[#DCE2F6]");

      setTimeout(() => {
        el.classList.remove("bg-[#DCE2F6]");
        el.classList.remove("ring-1");
        el.classList.remove("ring-[#DCE2F6]");
      }, 2000);
    }
  }, [commentIdFromUrl, comments]);
  // =========================
  // EDIT COMMENT
  // =========================

  const updateCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => {
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;

      const mentions: string[] = [];

      let match;

      while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[2]);
      }

      const cleanedContent = content.replace(
        /@\[([^\]]+)\]\(([^)]+)\)/g,
        "@$1",
      );

      return editComment(commentId, {
        content: cleanedContent,
        mentions: [...new Set(mentions)],
      });
    },

    onSuccess: () => {
      toast.success("Comment updated");

      setEditingCommentId(null);
      setEditingComment("");

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
      setSelectedTask(null);
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
    mutationFn: () => {
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;

      const mentions: string[] = [];

      let match;

      while ((match = mentionRegex.exec(comment)) !== null) {
        mentions.push(match[2]);
      }

      // clean content
      const cleanedContent = comment.replace(
        /@\[([^\]]+)\]\(([^)]+)\)/g,
        "@$1",
      );

      return addTaskComment(task.id, {
        content: cleanedContent,
        mentions: [...new Set(mentions)],
      });
    },

    onSuccess: () => {
      setComment("");

      queryClient.invalidateQueries({
        queryKey: ["comments", task.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", projectId],
      });

      toast.success("Comment added");
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const replyCommentMutation = useMutation({
    mutationFn: ({
      parentId,
      content,
    }: {
      parentId: string;
      content: string;
    }) => {
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;

      const mentions: string[] = [];

      let match;

      while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[2]);
      }

      const cleanedContent = content.replace(
        /@\[([^\]]+)\]\(([^)]+)\)/g,
        "@$1",
      );

      return addTaskComment(task.id, {
        content: cleanedContent,
        mentions: [...new Set(mentions)],
        parentId,
      });
    },

    onSuccess: () => {
      toast.success("Reply added");

      setReplyingToId(null);
      setReplyContent("");

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

  // =========================
  // DELETE COMMENT
  // =========================

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

  // =========================
  // REMOVE FROM SPRINT
  // =========================

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

  // =========================
  // CREATE TASK LINK
  // =========================

  const createTaskLinkMutation = useMutation({
    mutationFn: () =>
      createTaskLink(task.id, {
        targetTaskId: selectedLinkedTaskId,
        type: selectedLinkType as
          | "BLOCKS"
          | "RELATES_TO"
          | "DUPLICATES"
          | "DEPENDS_ON"
          | "CAUSED_BY",
      }),

    onSuccess: () => {
      toast.success("Task link created");

      setSelectedLinkedTaskId("");

      queryClient.invalidateQueries({
        queryKey: ["task", task.id],
      });

      refetchTaskDetails();
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // UPDATE TASK LINK
  // =========================

  const updateTaskLinkMutation = useMutation({
    mutationFn: ({
      linkId,
      type,
    }: {
      linkId: string;
      type: "BLOCKS" | "RELATES_TO" | "DUPLICATES" | "DEPENDS_ON" | "CAUSED_BY";
    }) => updateTaskLink(linkId, type),

    onSuccess: () => {
      toast.success("Task link updated");

      setEditingLinkId(null);

      queryClient.invalidateQueries({
        queryKey: ["task", task.id],
      });

      refetchTaskDetails();
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // DELETE TASK LINK
  // =========================

  const deleteTaskLinkMutation = useMutation({
    mutationFn: (linkId: string) => deleteTaskLink(linkId),

    onSuccess: () => {
      toast.success("Task link removed");

      queryClient.invalidateQueries({
        queryKey: ["task", task.id],
      });

      refetchTaskDetails();
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // FORMAT ESTIMATE
  // =========================

  const formatEstimate = (minutes?: number) => {
    const totalMinutes = minutes || 0;

    const hours = totalMinutes / 60;

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

  type CommentItemProps = {
    comment: any;
    level?: number;

    members: any[];
    currentUser: any;

    replyingToId: string | null;
    setReplyingToId: React.Dispatch<React.SetStateAction<string | null>>;

    replyContent: string;
    setReplyContent: React.Dispatch<React.SetStateAction<string>>;

    editingCommentId: string | null;
    setEditingCommentId: React.Dispatch<React.SetStateAction<string | null>>;

    editingComment: string;
    setEditingComment: React.Dispatch<React.SetStateAction<string>>;

    replyCommentMutation: any;
    updateCommentMutation: any;
    deleteCommentMutation: any;

    isAdmin: boolean;
    isSuperAdmin: boolean;
  };

  function CommentItem({
    comment,
    level = 0,

    members,
    currentUser,

    replyingToId,
    setReplyingToId,

    replyContent,
    setReplyContent,

    editingCommentId,
    setEditingCommentId,

    editingComment,
    setEditingComment,

    replyCommentMutation,
    updateCommentMutation,
    deleteCommentMutation,

    isAdmin,
    isSuperAdmin,
  }: CommentItemProps) {
    const isReplying = replyingToId === comment.id;
    const isEditing = editingCommentId === comment.id;

    return (
   <div
  ref={(el) => {
    commentRefs.current[comment.id] = el;
  }}
  className={`
    rounded-2xl border border-neutral-200 bg-white shadow-sm
    transition-all duration-500
    ${level === 0 ? "p-5" : "p-4"}
  `}
>
        {/* THREAD LINE */}
        {level > 0 && (
          <div className="absolute left-4 top-0 h-full bg-neutral-200" />
        )}

        <div
          className="relative"
          style={{
            marginLeft: `${Math.min(level, 4) * 24}px`,
          }}
        >
          {/* CONNECTOR */}
          {level > 0 && (
            <div className="absolute -left-2 top-8 h-px w-4 bg-neutral-200" />
          )}

          <div
            className={`
            rounded-2xl border border-neutral-200 bg-white shadow-sm
            ${level === 0 ? "p-5" : "p-4"}
          `}
          >
            {/* HEADER */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {/* AVATAR */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7189D0] text-xs font-bold text-white">
                  {comment.user.email?.charAt(0).toUpperCase()}
                </div>

                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {comment.user.email}
                  </div>

                  <div className="mt-0.5 text-xs text-neutral-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {(comment.userId === currentUser?.id ||
                isAdmin ||
                isSuperAdmin) && (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setEditingComment(comment.content);
                    }}
                    variant="outline"
                    className="text-xs "
                  >
                    Edit
                  </Button>

                  <Button
                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                    disabled={deleteCommentMutation.isPending}
                    variant="destructive"
                    className="text-xs "
                  >
                    {deleteCommentMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              )}
            </div>

            {/* CONTENT */}
            {!isEditing ? (
              <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-neutral-700">
                {comment.content}
              </div>
            ) : (
              <div className="mt-4">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                  <MentionsInput
                    value={editingComment}
                    onChange={(e: any) => setEditingComment(e.target.value)}
                    className="w-full"
                    style={{
                      control: {
                        backgroundColor: "transparent",
                        fontSize: 14,
                      },

                      input: {
                        margin: 0,
                        minHeight: 80,
                        border: "none",
                        outline: "none",
                      },

                      highlighter: {
                        overflow: "hidden",
                      },
                    }}
                  >
                    <Mention
                      trigger="@"
                      markup="@[__display__](__id__)"
                      displayTransform={(id: any, display: any) =>
                        `@${display}`
                      }
                      data={members.map((member: any) => ({
                        id: member.userId,
                        display: member.email,
                      }))}
                    />
                  </MentionsInput>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() =>
                      updateCommentMutation.mutate({
                        commentId: comment.id,
                        content: editingComment,
                      })
                    }
                    className="rounded-xl bg-[#7189D0] px-4 py-2 text-sm text-white"
                  >
                    Save
                  </Button>

                  <Button
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditingComment("");
                    }}
                    className="rounded-xl border px-4 py-2 text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* ACTIONS */}
            {!isEditing && (
              <div className="mt-4 flex items-center gap-4 border-t border-neutral-100 pt-4 cursor-pointer">
                <Button
                  onClick={() => {
                    setReplyingToId(isReplying ? null : comment.id);

                    setReplyContent("");
                  }}
                  variant="outline"
                  className="text-xs "
                >
                  {isReplying ? "Cancel" : "Reply"}
                </Button>
              </div>
            )}

            {/* REPLY BOX */}
            {isReplying && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="rounded-2xl border border-neutral-200 bg-white p-3">
                  <MentionsInput
                    value={replyContent}
                    onChange={(e: any) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full"
                    style={{
                      control: {
                        backgroundColor: "transparent",
                        fontSize: 14,
                      },

                      input: {
                        margin: 0,
                        minHeight: 70,
                        border: "none",
                        outline: "none",
                      },

                      highlighter: {
                        overflow: "hidden",
                      },
                    }}
                  >
                    <Mention
                      trigger="@"
                      markup="@[__display__](__id__)"
                      displayTransform={(id: any, display: any) =>
                        `@${display}`
                      }
                      data={members.map((member: any) => ({
                        id: member.userId,
                        display: member.email,
                      }))}
                    />
                  </MentionsInput>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() =>
                      replyCommentMutation.mutate({
                        parentId: comment.id,
                        content: replyContent,
                      })
                    }
                    disabled={
                      !replyContent.trim() || replyCommentMutation.isPending
                    }
                    className="rounded-xl bg-[#7189D0] px-4 py-2 text-sm text-white"
                  >
                    {replyCommentMutation.isPending ? "Replying..." : "Reply"}
                  </Button>

                  <Button
                    onClick={() => {
                      setReplyingToId(null);
                      setReplyContent("");
                    }}
                    className="rounded-xl border px-4 py-2 text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* REPLIES */}
          {!!comment.replies?.length && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply: any) => {
                const isReplying = replyingToId === reply.id;
                const isEditing = editingCommentId === reply.id;

                return (
                  <div
                    key={reply.id}
                    ref={(el) => {
                      commentRefs.current[reply.id] = el;
                    }}
                    className="relative"
                    style={{
                      marginLeft: "24px",
                    }}
                  >
                    {/* THREAD LINE */}
                    <div className="absolute left-4 top-0 h-full bg-neutral-200" />

                    {/* CONNECTOR */}
                    <div className="absolute -left-2 top-8 h-px w-4 bg-neutral-200" />

                    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                      {/* HEADER */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7189D0] text-xs font-bold text-white">
                            {reply.user.email?.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="text-sm font-semibold text-neutral-900">
                              {reply.user.email}
                            </div>

                            <div className="mt-0.5 text-xs text-neutral-400">
                              {new Date(reply.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {(reply.userId === currentUser?.id ||
                          isAdmin ||
                          isSuperAdmin) && (
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={() => {
                                setEditingCommentId(reply.id);
                                setEditingComment(reply.content);
                              }}
                              variant="outline"
                              className="text-xs "
                            >
                              Edit
                            </Button>

                            <Button
                              onClick={() =>
                                deleteCommentMutation.mutate(reply.id)
                              }
                              disabled={deleteCommentMutation.isPending}
                              className="text-xs "
                              variant="destructive"
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* CONTENT */}
                      {!isEditing ? (
                        <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-neutral-700">
                          {reply.content}
                        </div>
                      ) : (
                        <div className="mt-4">
                          {/* Same edit UI you already have */}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl">
        {/* HEADER */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="mb-2 text-sm text-neutral-500">
              {" "}
              <span className="flex gap-2 items-center justify-between">
                <span className="flex gap-2 items-center">
                  {task.taskKey} {getTaskTypeIcon(task.type)}
                </span>
                <span className="flex gap-2 items-center">{task.status}</span>
              </span>
            </div>

            <h2 className="text-3xl font-bold">{task.title}</h2>
          </div>

          <Button onClick={onClose} className="rounded-xl border px-4 py-2">
            Close
          </Button>
        </div>

        {/* SPRINT */}
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
              <Button
                onClick={() => removeFromSprintMutation.mutate()}
                disabled={removeFromSprintMutation.isPending}
                className="rounded-xl bg-[#7189D0] px-4 py-2 text-sm text-white"
              >
                {!removeFromSprintMutation.isPending
                  ? "Move to Backlog"
                  : "Moving...."}
              </Button>
            )}
          </div>
        </div>

        {/* EDIT */}
        <div className="mt-6 rounded-3xl border bg-neutral-50 p-5">
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
              <option value="HIGHEST">HIGHEST</option>
            </select>

            <select
              value={editForm.type}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  type: e.target.value as
                    | "STORY"
                    | "TASK"
                    | "SUBTASK"
                    | "EPIC"
                    | "IMPROVEMENT"
                    | "BUG",
                })
              }
              className="w-full rounded-2xl border border-neutral-200 bg-white p-4 outline-none transition focus:border-black"
            >
              <option value="STORY">STORY</option>

              <option value="TASK">TASK</option>

              <option value="SUBTASK">SUBTASK</option>

              <option value="EPIC">EPIC</option>

              <option value="IMPROVEMENT">IMPROVEMENT</option>

              <option value="BUG">BUG</option>
            </select>

            <input
              type="date"
              value={editForm.dueDate ? new Date(editForm.dueDate).toISOString().split("T")[0] : ""}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  dueDate: new Date(e.target.value).toISOString(),
                })
              }
              className="w-full rounded-2xl border border-neutral-200 bg-white p-3"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-neutral-600">
              Estimate
            </label>

            <div className="relative">
              <input
                type="number"
                value={
                 editForm.estimateMinutes ? new Date(editForm.estimateMinutes).toISOString().split("T")[0] : ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    dueDate: task.dueDate
                      ? new Date(task.dueDate).toISOString().split("T")[0]
                      : "",
                  })
                }
                className="w-full rounded-2xl border border-neutral-200 bg-white p-3 pr-20 outline-none"
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                {formatEstimate(editForm.estimateMinutes)}
              </div>
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
            <Button
              onClick={() => updateTaskMutation.mutate()}
              disabled={updateTaskMutation.isPending}
              className="rounded-2xl bg-[#7189D0] px-5 py-3 text-white"
            >
              {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
            </Button>

            <Button
              onClick={() => deleteMutation.mutate()}
              className="rounded-2xl  px-5 py-3 text-white"
            >
              Delete
            </Button>
          </div>
        </div>

        {/* TASK LINKING */}
        {/* TASK LINKING */}
        <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-neutral-900">Linked Tasks</h3>

            <p className="mt-1 text-sm text-neutral-500">
              Create dependency and relationship between tasks
            </p>
          </div>

          {/* CREATE LINK */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* TASK DROPDOWN */}
            <div>
              {tasksLoading ? (
                <div className="flex h-[56px] items-center rounded-2xl border border-neutral-200 bg-neutral-50 px-4">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />

                  <span className="ml-2 text-sm text-neutral-500">
                    Loading tasks...
                  </span>
                </div>
              ) : (
                <select
                  value={selectedLinkedTaskId}
                  onChange={(e) => setSelectedLinkedTaskId(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-4 outline-none transition focus:border-black"
                >
                  <option value="">Select Task</option>

                  {availableTasks.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.taskKey} - {t.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* LINK TYPE */}
            <select
              value={selectedLinkType}
              onChange={(e) => setSelectedLinkType(e.target.value)}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 outline-none transition focus:border-black"
            >
              <option value="BLOCKS">BLOCKS</option>

              <option value="RELATES_TO">RELATES_TO</option>

              <option value="DUPLICATES">DUPLICATES</option>

              <option value="DEPENDS_ON">DEPENDS_ON</option>

              <option value="CAUSED_BY">CAUSED_BY</option>
            </select>

            {/* CREATE BUTTON */}
            <Button
              onClick={() => {
                if (!selectedLinkedTaskId) {
                  toast.error("Please select task");

                  return;
                }

                createTaskLinkMutation.mutate();
              }}
              disabled={createTaskLinkMutation.isPending}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#7189D0] px-5 py-3 text-white disabled:opacity-50"
            >
              {createTaskLinkMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Add Link
            </Button>
          </div>

          {/* LINKS LIST */}
          <div className="mt-8 space-y-4">
            {taskDetailsLoading ? (
              <div className="rounded-2xl border border-neutral-200 p-8">
                <div className="flex items-center justify-center gap-3 text-neutral-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading linked tasks...
                </div>
              </div>
            ) : (
              <>
                {/* OUTGOING LINKS */}
                {taskData?.linkedTasks?.map((link: any) => (
                  <div
                    key={link.id}
                    className="rounded-2xl border border-neutral-200 bg-white p-5 cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/tasks/${projectId}?sprint=${sprintId}&taskId=${link.id}`,
                      )
                    }
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* LEFT */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#7189D0] px-2 py-1 text-xs font-semibold text-white">
                            OUTGOING
                          </span>

                          <span className="text-sm font-semibold text-neutral-500">
                            {link.type}
                          </span>
                        </div>

                        <div className="mt-2 font-bold text-neutral-900">
                          {link.targetTask?.taskKey}
                        </div>

                        <div className="text-sm text-neutral-600">
                          {link.targetTask?.title}
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex flex-wrap items-center gap-3">
                        {editingLinkId === link.id ? (
                          <>
                            <select
                              value={editingLinkType}
                              onChange={(e) =>
                                setEditingLinkType(e.target.value)
                              }
                              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                            >
                              <option value="BLOCKS">BLOCKS</option>

                              <option value="RELATES_TO">RELATES_TO</option>

                              <option value="DUPLICATES">DUPLICATES</option>

                              <option value="DEPENDS_ON">DEPENDS_ON</option>

                              <option value="CAUSED_BY">CAUSED_BY</option>
                            </select>

                            <Button
                              onClick={() =>
                                updateTaskLinkMutation.mutate({
                                  linkId: link.id,
                                  type: editingLinkType as
                                    | "BLOCKS"
                                    | "RELATES_TO"
                                    | "DUPLICATES"
                                    | "DEPENDS_ON"
                                    | "CAUSED_BY",
                                })
                              }
                              disabled={updateTaskLinkMutation.isPending}
                              className="rounded-xl bg-[#7189D0] px-4 py-2 text-sm text-white"
                            >
                              {updateTaskLinkMutation.isPending
                                ? "Updating..."
                                : "Update"}
                            </Button>

                            <Button
                              onClick={() => setEditingLinkId(null)}
                              className="rounded-xl border px-4 py-2 text-sm"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => {
                                setEditingLinkId(link.id);

                                setEditingLinkType(link.type);
                              }}
                              variant="outline"
                              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm"
                            >
                              Edit
                            </Button>

                            <Button
                              onClick={() =>
                                deleteTaskLinkMutation.mutate(link.id)
                              }
                              variant="destructive"
                              className="rounded-xl px-4 py-2 text-sm"
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* INCOMING LINKS */}
                {taskData?.linkedFromTasks?.map((link: any) => (
                  <div
                    key={link.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* LEFT */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-neutral-700 px-2 py-1 text-xs font-semibold text-white">
                            INCOMING
                          </span>

                          <span className="text-sm font-semibold text-neutral-500">
                            {link.type}
                          </span>
                        </div>

                        <div className="mt-2 font-bold text-neutral-900">
                          {link.sourceTask?.taskKey}
                        </div>

                        <div className="text-sm text-neutral-600">
                          {link.sourceTask?.title}
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex flex-wrap items-center gap-3">
                        {editingLinkId === link.id ? (
                          <>
                            <select
                              value={editingLinkType}
                              onChange={(e) =>
                                setEditingLinkType(e.target.value)
                              }
                              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                            >
                              <option value="BLOCKS">BLOCKS</option>

                              <option value="RELATES_TO">RELATES_TO</option>

                              <option value="DUPLICATES">DUPLICATES</option>

                              <option value="DEPENDS_ON">DEPENDS_ON</option>

                              <option value="CAUSED_BY">CAUSED_BY</option>
                            </select>

                            <Button
                              onClick={() =>
                                updateTaskLinkMutation.mutate({
                                  linkId: link.id,
                                  type: editingLinkType as
                                    | "BLOCKS"
                                    | "RELATES_TO"
                                    | "DUPLICATES"
                                    | "DEPENDS_ON"
                                    | "CAUSED_BY",
                                })
                              }
                              disabled={updateTaskLinkMutation.isPending}
                              className="rounded-xl bg-[#7189D0] px-4 py-2 text-sm text-white"
                            >
                              {updateTaskLinkMutation.isPending
                                ? "Updating..."
                                : "Update"}
                            </Button>

                            <Button
                              onClick={() => setEditingLinkId(null)}
                              className="rounded-xl border px-4 py-2 text-sm"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => {
                                setEditingLinkId(link.id);

                                setEditingLinkType(link.type);
                              }}
                              variant="outline"
                              className="rounded-xl px-4 py-2 text-sm"
                            >
                              Edit
                            </Button>

                            <Button
                              onClick={() =>
                                deleteTaskLinkMutation.mutate(link.id)
                              }
                              variant="destructive"
                              className="rounded-xl px-4 py-2 text-sm"
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* EMPTY STATE */}
                {!taskData?.linkedTasks?.length &&
                  !taskData?.linkedFromTasks?.length && (
                    <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center">
                      <Link2 className="mx-auto mb-3 h-10 w-10 text-neutral-300" />

                      <div className="text-sm font-medium text-neutral-600">
                        No linked tasks found
                      </div>

                      <div className="mt-1 text-xs text-neutral-400">
                        Create relationships between tasks
                      </div>
                    </div>
                  )}
              </>
            )}
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

            <Button
              onClick={(e) => {
                e.stopPropagation();
                assignTaskMutation.mutate(currentUser?.id);
              }}
              className="flex items-center gap-2 cursor-pointer rounded-2xl bg-[#7189D0] px-3 py-3 text-sm font-medium text-white transition hover:opacity-90"
              disabled={assignTaskMutation.isPending}
            >
              {assignTaskMutation.isPending ? "Assigning..." : "Assign to me"}
            </Button>
            {task.assignee && (
              <div className="rounded-2xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">
                Current: {task.assignee.email}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <select
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4"
              >
                <option value="">Select team member</option>

                {members.map((member: any) => (
                  <option key={member.userId} value={member.userId}>
                    {member.email} ({member.role})
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => {
                if (!selectedUserId) {
                  toast.error("Please select a member");
                  return;
                }

                assignTaskMutation.mutate(selectedUserId);
              }}
              className="rounded-2xl bg-[#7189D0] px-6 py-4 text-white"
              disabled={assignTaskMutation.isPending}
            >
              {assignTaskMutation.isPending ? "Assigning..." : "Assign Task"}
            </Button>
          </div>
        </div>

        {/* COMMENTS */}
        <div className="mt-6 rounded-3xl border bg-neutral-50 p-5">
          <div className="mb-5 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />

            <h3 className="text-lg font-semibold">Comments</h3>
          </div>
          <div className="mt-5 flex gap-3 items-start">
            <div className="flex-1 rounded-2xl border bg-white p-2">
              <MentionsInput
                value={comment}
                onChange={(e: any) => setComment(e.target.value)}
                placeholder="Write comment..."
                className="w-full outline-none"
                style={{
                  control: {
                    backgroundColor: "transparent",
                    fontSize: 14,
                  },

                  highlighter: {
                    overflow: "hidden",
                  },

                  input: {
                    margin: 0,
                    minHeight: 60,
                    outline: "none",
                    border: "none",
                  },

                  suggestions: {
                    list: {
                      backgroundColor: "white",
                      border: "1px solid #ddd",
                      borderRadius: "12px",
                      overflow: "hidden",
                    },

                    item: {
                      padding: "10px 14px",

                      "&focused": {
                        backgroundColor: "#f3f4f6",
                      },
                    },
                  },
                }}
              >
                <Mention
                  trigger="@"
                  markup="@[__display__](__id__)"
                  displayTransform={(id: any, display: any) => `@${display}`}
                  data={members.map((member: any) => ({
                    id: member.userId,
                    display: member.email,
                  }))}
                />
              </MentionsInput>
            </div>

            <Button
              onClick={() => addCommentMutation.mutate()}
              disabled={addCommentMutation.isPending}
              className="rounded-2xl bg-[#7189D0] px-5 py-3 text-white"
            >
              {addCommentMutation.isPending ? "Sending.." : "Send"}
            </Button>
          </div>
          <div className="space-y-5 mt-3">
            {comments
              .filter((c: any) => !c.parentId)
              .map((comment: any) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  members={members}
                  currentUser={currentUser}
                  replyingToId={replyingToId}
                  setReplyingToId={setReplyingToId}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  editingCommentId={editingCommentId}
                  setEditingCommentId={setEditingCommentId}
                  editingComment={editingComment}
                  setEditingComment={setEditingComment}
                  replyCommentMutation={replyCommentMutation}
                  updateCommentMutation={updateCommentMutation}
                  deleteCommentMutation={deleteCommentMutation}
                  isAdmin={isAdmin}
                  isSuperAdmin={isSuperAdmin}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
