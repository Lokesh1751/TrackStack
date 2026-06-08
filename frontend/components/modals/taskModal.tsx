"use client";

import { useState } from "react";
import {
  getProjectTasks,
  deleteTask,
  assignTask,
  unassignTask,
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
  addTaskAttachment,
  deleteTaskAttachment,
  getTaskAttachments,
} from "@/lib/api";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MentionsInput, Mention } from "react-mentions";

import {
  Loader2,
  MessageSquare,
  Link2,
  Pencil,
  X,
  Delete,
  Trash,
  Paperclip,
} from "lucide-react";
import { getTaskTypeIcon } from "@/helpers";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CommentItem } from "@/components/comment-item";
import { CommentsSkeleton } from "../skeleton/comments";
import { enumtoText } from "@/helpers";

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
  const [commentAttachments, setCommentAttachments] = useState<{ fileName: string; fileUrl: string }[]>([]);
  const [commentUploading, setCommentUploading] = useState(false);

  const handleCommentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setCommentUploading(true);
      const newFiles = [...commentAttachments];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
        );

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData?.error?.message || "Upload failed");
        }

        newFiles.push({
          fileName: file.name,
          fileUrl: uploadData.secure_url,
        });
      }

      setCommentAttachments(newFiles);
      toast.success("Comment files uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setCommentUploading(false);
      e.target.value = "";
    }
  };

  const removeCommentAttachment = (index: number) => {
    setCommentAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    estimateMinutes: task.estimateMinutes || 0,
    type: task.type,
    dueDate: task.dueDate,
    status: task.status,
  });

  const [isEditing, setIsEditing] = useState(false);

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

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
        );

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData?.error?.message || "Upload failed");
        }

        const fileUrl = uploadData.secure_url;
        const fileName = file.name;

        await addTaskAttachment(task.id, {
          fileName,
          fileUrl,
        });
      }

      toast.success("Attachments uploaded successfully");
      refetchTaskDetails();
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => deleteTaskAttachment(attachmentId),
    onSuccess: () => {
      toast.success("Attachment deleted");
      refetchTaskDetails();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete attachment");
    },
  });

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
  const attachments = taskData.attachments || [];

  // =========================
  // GET COMMENTS
  // =========================

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
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

      el.classList.add("bg-red-800");
      el.classList.add("ring-1");

      setTimeout(() => {
        el.classList.remove("bg-red-800");
        el.classList.remove("ring-1");
      }, 5000);
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

  const assignToMeMutation = useMutation({
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

  const unassignTaskMutation = useMutation({
    mutationFn: (assigneeId: string | null) =>
      unassignTask(task.id, assigneeId as string),

    onSuccess: () => {
      toast.success("Task unassigned");

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
        attachments: commentAttachments,
      });
    },

    onSuccess: () => {
      setComment("");
      setCommentAttachments([]);

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
      attachments,
    }: {
      parentId: string;
      content: string;
      attachments?: { fileName: string; fileUrl: string }[];
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
        attachments,
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
          <div className="flex gap-2 items-center ">
            <Button
              size={"lg"}
              variant="destructive"
              className="border border-red-600 rounded-full cursor-pointer"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-5 h-5 text-red-600 cursor-pointer animate-spin" />
              ) : (
                <Trash className="w-5 h-5 text-red-600 cursor-pointer" />
              )}
            </Button>
            <Button onClick={onClose} className="rounded-xl border px-4 py-2">
              Close
            </Button>
          </div>
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
          <div className="flex justify-between items-center">
            <div className="flex flex-row gap-2">
              <h3 className="mb-5 text-lg font-semibold">Task Details</h3>
              <span
                className="rounded-full  cursor-pointer p-1 items-center justify-center"
                onClick={() => setIsEditing(!isEditing)}
              >
                {!isEditing ? (
                  <Pencil className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </span>
            </div>
            {isEditing ? (
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value })
                }
                className="rounded-lg border border-neutral-200 px-2 py-1 text-black"
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            ) : (
              <div className="rounded-lg  px-2 py-1 text-black">
                {enumtoText(editForm.status) || "-"}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* TITLE */}
            {isEditing ? (
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
            ) : (
              <div className="rounded-2xl border bg-white p-3">
                {editForm.title || "-"}
              </div>
            )}

            {/* PRIORITY */}
            {isEditing ? (
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
            ) : (
              <div className="rounded-2xl border bg-white p-3">
                {editForm.priority}
              </div>
            )}

            {/* TYPE */}
            {isEditing ? (
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
                className="rounded-2xl border bg-white p-3"
              >
                <option value="STORY">STORY</option>
                <option value="TASK">TASK</option>
                <option value="SUBTASK">SUBTASK</option>
                <option value="EPIC">EPIC</option>
                <option value="IMPROVEMENT">IMPROVEMENT</option>
                <option value="BUG">BUG</option>
              </select>
            ) : (
              <div className="rounded-2xl border bg-white p-3">
                {editForm.type}
              </div>
            )}

            {/* DUE DATE */}
            {isEditing ? (
              <input
                type="date"
                value={
                  editForm.dueDate
                    ? new Date(editForm.dueDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    dueDate: new Date(e.target.value).toISOString(),
                  })
                }
                className="rounded-2xl border bg-white p-3"
              />
            ) : (
              <div className="rounded-2xl border bg-white p-3">
                {editForm.dueDate
                  ? new Date(editForm.dueDate).toLocaleDateString()
                  : "-"}
              </div>
            )}
          </div>

          {/* ESTIMATE */}
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-neutral-600">
              Estimate
            </label>

            {isEditing ? (
              <input
                type="number"
                value={editForm.estimateMinutes || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    estimateMinutes: Number(e.target.value),
                  })
                }
                className="w-full rounded-2xl border bg-white p-3"
              />
            ) : (
              <div className="rounded-2xl border bg-white p-3">
                {formatEstimate(editForm.estimateMinutes)}
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="mt-4">
            {isEditing ? (
              <textarea
                rows={5}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    description: e.target.value,
                  })
                }
                className="w-full rounded-2xl border bg-white p-4"
              />
            ) : (
              <div className="min-h-[120px] whitespace-pre-wrap rounded-2xl border bg-white p-4">
                {editForm.description || "No description available"}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="mt-5 flex gap-3">
              <Button
                onClick={() => updateTaskMutation.mutate()}
                disabled={updateTaskMutation.isPending}
              >
                {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
              </Button>

              <Button variant="destructive" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          )}
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
                assignToMeMutation.mutate(currentUser?.id);
              }}
              className="flex items-center gap-2 cursor-pointer rounded-2xl bg-[#7189D0] px-3 py-3 text-sm font-medium text-white transition hover:opacity-90"
              disabled={assignToMeMutation.isPending}
            >
              {assignToMeMutation.isPending ? "Assigning..." : "Assign to me"}
            </Button>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                unassignTaskMutation.mutate(currentUser?.id);
              }}
              className="flex items-center gap-2 cursor-pointer rounded-2xl bg-[#7189D0] px-3 py-3 text-sm font-medium text-white transition hover:opacity-90"
              disabled={unassignTaskMutation.isPending}
            >
              {unassignTaskMutation.isPending ? "Unassigning..." : "Unassign"}
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

                {members
                  ?.filter(
                    (member: any) => member.userId !== task?.assignee?.id,
                  )
                  .map((member: any) => (
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

        {/* ATTACHMENTS */}
        <div className="mt-6 rounded-3xl border bg-neutral-50 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Attachments</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="task-details-file-upload"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="task-details-file-upload"
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#7189D0] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Paperclip className="h-4 w-4" />
                    Upload File
                  </>
                )}
              </label>
            </div>
          </div>

          {attachments.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {attachments.map((file: any) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm"
                >
                  <div className="flex flex-col truncate max-w-[75%]">
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#7189D0] hover:underline truncate"
                    >
                      <img src={file.fileUrl} alt={file.fileName} className="w-10 h-10 rounded-md" />
                      {file.fileName}
                    </a>
                    <span className="text-xs text-neutral-400">
                      Uploaded by {file.uploadedBy?.email || "Unknown"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteAttachmentMutation.mutate(file.id)}
                    disabled={deleteAttachmentMutation.isPending}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 italic">No attachments uploaded yet</p>
          )}
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

              {/* LIST OF UPLOADED COMMENT ATTACHMENTS */}
              {commentAttachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 border-t border-neutral-100 pt-2">
                  {commentAttachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700"
                    >
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{file.fileName}</span>
                      <button
                        type="button"
                        onClick={() => removeCommentAttachment(idx)}
                        className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="file"
                id="comment-file-upload"
                multiple
                onChange={handleCommentFileUpload}
                className="hidden"
                disabled={commentUploading}
              />
              <label
                htmlFor="comment-file-upload"
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-neutral-300 p-3 hover:border-black/55 transition text-sm font-medium text-neutral-600 bg-white"
                title="Attach Files"
              >
                {commentUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                ) : (
                  <Paperclip className="h-4 w-4 text-neutral-500" />
                )}
              </label>

              <Button
                onClick={() => addCommentMutation.mutate()}
                disabled={addCommentMutation.isPending || !comment.trim()}
                className="rounded-2xl bg-[#7189D0] px-5 py-3 text-white"
              >
                {addCommentMutation.isPending ? "Sending.." : "Send"}
              </Button>
            </div>
          </div>
          {commentsLoading ? (
            <CommentsSkeleton />
          ) : (
            <div className="space-y-5 mt-3 mb-3">
              {comments
                .filter((c: any) => !c.parentId)
                .map((comment: any) => (
                  <CommentItem
                    key={comment.id}
                    comments={comments}
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
          )}
        </div>
      </div>
    </div>
  );
}
