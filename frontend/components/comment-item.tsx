"use client";

import React, { useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MentionsInput, Mention } from "react-mentions";
import { Button } from "@/components/ui/button";

export type CommentItemProps = {
  comment: any;
  level?: number;
  comments: any[];

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

export const CommentItem = function CommentItem({
  comment,
  level = 0,
  comments,

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

  const searchParams = useSearchParams();
  const commentIdFromUrl = searchParams.get("commentId");

  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});
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
                    displayTransform={(id: any, display: any) => `@${display}`}
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
                  disabled={updateCommentMutation.isPending}
                  className="rounded-xl bg-[#7189D0] px-4 py-2 text-sm text-white"
                >
                  {updateCommentMutation.isPending ? "Saving..." : "Save"}
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
                    displayTransform={(id: any, display: any) => `@${display}`}
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
        <div className="flex flex-col gap-3 mt-3">
          {comment.replies?.map((reply: any) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              level={level + 1}
              comments={comments}
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
  );
};
