"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  FolderKanban,
  FolderOpen,
  Users,
  UserPlus,
  UserMinus,
  Shield,
  ClipboardList,
  MessageSquare,
  Link2,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  Notification,
} from "@/lib/api";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/useToast";

const LIMIT = 15;

export function NotificationsSheet() {
  const router = useRouter();

  const toast = useToast();

  const [open, setOpen] = useState(false);

  // =====================================================
  // GET UNREAD COUNT
  // =====================================================

  const unreadQuery = useQuery({
    queryKey: ["unread-notifications-count"],

    queryFn: getUnreadNotificationsCount,

    refetchInterval: 10000,
  });

  const unreadCount = unreadQuery.data ?? 0;

  // =====================================================
  // GET NOTIFICATIONS
  // =====================================================

  const notificationsQuery = useInfiniteQuery({
    queryKey: ["notifications"],

    initialPageParam: 1,

    queryFn: async ({ pageParam }) => getNotifications(pageParam, LIMIT),

    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }

      return undefined;
    },
  });

  const notifications = useMemo(() => {
    return notificationsQuery.data?.pages.flatMap(
      (page) => page?.notifications,
    );
  }, [notificationsQuery.data]);

  // =====================================================
  // MARK SINGLE READ
  // =====================================================

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,

    onSuccess: () => {
      notificationsQuery.refetch();
      unreadQuery.refetch();
    },
  });

  // =====================================================
  // MARK ALL READ
  // =====================================================

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,

    onSuccess: () => {
      toast.success("All notifications marked as read");

      notificationsQuery.refetch();
      unreadQuery.refetch();
    },
  });

  // =====================================================
  // DELETE
  // =====================================================

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,

    onSuccess: () => {
      toast.success("Notification deleted");

      notificationsQuery.refetch();
      unreadQuery.refetch();
    },
  });

  // =====================================================
  // AUTO MARK AS READ WHEN OPENED
  // =====================================================

  useEffect(() => {
    if (!open) return;

    const unreadNotifications =
      notifications?.filter((notification) => !notification?.isRead) || [];

    if (!unreadNotifications?.length) return;

    unreadNotifications.forEach((notification) => {
      markReadMutation.mutate(notification?.id);
    });
  }, [open, notifications]);

  // =====================================================
  // ICONS
  // =====================================================

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "WORKSPACE_CREATED":
      case "WORKSPACE_UPDATED":
      case "WORKSPACE_DELETED":
        return <FolderKanban className="h-5 w-5" />;

      case "WORKSPACE_MEMBER_INVITED":
      case "PROJECT_MEMBER_INVITED":
        return <UserPlus className="h-5 w-5" />;

      case "WORKSPACE_MEMBER_REMOVED":
      case "PROJECT_MEMBER_REMOVED":
        return <UserMinus className="h-5 w-5" />;

      case "WORKSPACE_ROLE_UPDATED":
        return <Shield className="h-5 w-5" />;

      case "WORKSPACE_INVITE_ACCEPTED":
      case "SPRINT_COMPLETED":
        return <CheckCircle2 className="h-5 w-5" />;

      case "WORKSPACE_INVITE_DECLINED":
        return <AlertCircle className="h-5 w-5" />;

      case "PROJECT_CREATED":
      case "PROJECT_UPDATED":
      case "PROJECT_DELETED":
        return <FolderOpen className="h-5 w-5" />;

      case "PROJECT_MEMBER_ADDED":
      case "PROJECT_MEMBER_JOINED":
        return <Users className="h-5 w-5" />;

      case "SPRINT_CREATED":
      case "SPRINT_UPDATED":
      case "SPRINT_STARTED":
      case "SPRINT_DELETED":
        return <Rocket className="h-5 w-5" />;

      case "TASK_ADDED_TO_SPRINT":
      case "TASK_REMOVED_FROM_SPRINT":
      case "TASK_CREATED":
      case "TASK_UPDATED":
      case "TASK_DELETED":
      case "TASK_ASSIGNED":
      case "TASK_STATUS_UPDATED":
      case "TASK_MOVED_TO_SPRINT":
      case "TASK_MOVED_TO_BACKLOG":
        return <ClipboardList className="h-5 w-5" />;

      case "TASK_COMMENT_ADDED":
      case "TASK_COMMENT_DELETED":
        return <MessageSquare className="h-5 w-5" />;

      case "TASK_LINKED":
      case "TASK_LINK_REMOVED":
      case "TASK_LINK_UPDATED":
        return <Link2 className="h-5 w-5" />;

      case "SYSTEM":
        return <Sparkles className="h-5 w-5" />;

      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // =====================================================
  // REDIRECT URL
  // =====================================================

  const getRedirectUrl = (notification: Notification) => {
    switch (notification?.type) {
      case "WORKSPACE_CREATED":
      case "WORKSPACE_UPDATED":
      case "WORKSPACE_DELETED":
      case "WORKSPACE_MEMBER_INVITED":
      case "PROJECT_MEMBER_INVITED":
      case "WORKSPACE_ROLE_UPDATED":
      case "WORKSPACE_INVITE_ACCEPTED":
      case "WORKSPACE_MEMBER_REMOVED":
      case "PROJECT_MEMBER_REMOVED":
        return `/workspace/${notification?.workspaceId}`;

      case "PROJECT_CREATED":
      case "PROJECT_UPDATED":
      case "PROJECT_DELETED":
      case "PROJECT_MEMBER_ADDED":
      case "PROJECT_MEMBER_JOINED":
        return `/workspace/${notification?.projectId}/projects`;

      case "SPRINT_CREATED":
      case "SPRINT_UPDATED":
      case "SPRINT_STARTED":
      case "SPRINT_COMPLETED":
        return `/sprint/${notification?.projectId}?sprintId=${notification?.sprintId}`;

      case "TASK_ADDED_TO_SPRINT":
      case "TASK_REMOVED_FROM_SPRINT":
      case "TASK_CREATED":
      case "TASK_UPDATED":
      case "TASK_DELETED":
      case "TASK_ASSIGNED":
      case "TASK_STATUS_UPDATED":
      case "TASK_MOVED_TO_SPRINT":
      case "TASK_MOVED_TO_BACKLOG":
      case "TASK_COMMENT_ADDED":
      case "TASK_COMMENT_DELETED":

      case "TASK_LINKED":
      case "TASK_LINK_REMOVED":
      case "TASK_LINK_UPDATED":
        return `/tasks/${notification?.projectId}?sprintId=${notification?.sprintId}&taskId=${notification?.taskId}`;

      default:
        return "#";
    }
  };

  // =====================================================
  // CLICK NOTIFICATION
  // =====================================================

  const handleClickNotification = async (notification: Notification) => {
    const url = getRedirectUrl(notification);

    if (url !== "#") {
      router.push(url);

      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* ===================================================== */}
      {/* TRIGGER */}
      {/* ===================================================== */}

      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-11 w-11 rounded-2xl border-[#dfe5f1] bg-white hover:bg-[#f4f7ff]"
        >
          <Bell className="h-5 w-5 text-[#4b5563]" />

          {unreadCount ? (
            <div className="absolute -right-[1px] -top-[1px] flex h-3 min-w-3 items-center justify-center rounded-full bg-red-500 px-1 text-[4px] font-bold text-white">
              {unreadCount?.count > 99 ? "99+" : unreadCount?.count}
            </div>
          ) : null}
        </Button>
      </SheetTrigger>

      {/* ===================================================== */}
      {/* CONTENT */}
      {/* ===================================================== */}

      <SheetContent className="w-full border-l border-[#e8edf7] p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-[#eef2f7] px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-left text-xl font-bold text-[#111827]">
                Notifications
              </SheetTitle>

              <p className="mt-1 text-sm text-[#6b7280]">
                Stay updated with workspace activities
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
              className="rounded-xl"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Read All
            </Button>
          </div>
        </SheetHeader>

        {/* ===================================================== */}
        {/* LIST */}
        {/* ===================================================== */}

        <ScrollArea className="h-[calc(100vh-90px)]">
          <div className="space-y-3 p-4">
            {notifications?.length ? (
              notifications.map((notification) => (
                <div
                  key={notification?.id}
                  onClick={() => handleClickNotification(notification)}
                  className={`group cursor-pointer rounded-3xl border p-4 transition-all ${
                    notification?.isRead
                      ? "border-[#edf1f7] bg-white"
                      : "border-[#dbe7ff] bg-[#f7faff]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* ICON */}

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        notification?.isRead
                          ? "bg-[#f3f4f6] text-[#6b7280]"
                          : "bg-[#7189D0] text-white"
                      }`}
                    >
                      {getNotificationIcon(notification?.type)}
                    </div>

                    {/* CONTENT */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-[#111827]">
                            {notification?.title}
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-[#6b7280]">
                            {notification?.message}
                          </p>
                        </div>

                        {!notification?.isRead && (
                          <Badge className="rounded-full bg-[#7189D0]">
                            New
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-[#9ca3af]">
                          {notification?.createdAt
                            ? new Date(notification?.createdAt).toLocaleString()
                            : ""}
                        </p>

                        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                          {!notification?.isRead && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation();

                                markReadMutation.mutate(notification?.id);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-xl text-red-500 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();

                              deleteMutation.mutate(notification?.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <ArrowRight className="h-4 w-4 text-[#94a3b8]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f3f6fd]">
                  <Bell className="h-9 w-9 text-[#7189D0]" />
                </div>

                <h3 className="mt-6 text-lg font-semibold text-[#111827]">
                  No notifications
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-[#6b7280]">
                  You’re all caught up. New workspace activities will appear
                  here.
                </p>
              </div>
            )}

            {/* ===================================================== */}
            {/* LOAD MORE */}
            {/* ===================================================== */}

            {notificationsQuery.hasNextPage && (
              <Button
                variant="outline"
                className="w-full rounded-2xl"
                disabled={notificationsQuery.isFetchingNextPage}
                onClick={() => notificationsQuery.fetchNextPage()}
              >
                {notificationsQuery.isFetchingNextPage
                  ? "Loading..."
                  : "Load More"}
              </Button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
