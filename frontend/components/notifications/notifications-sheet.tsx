"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { getNotificationIcon,getRedirectUrl } from "@/helpers";

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
import { NotificationsSkeleton } from "../skeleton/notifications-skeleton";

const LIMIT = 15;

export function NotificationsSheet() {
  const router = useRouter();

  const toast = useToast();

  const [open, setOpen] = useState(false);

  const userId =
  typeof window !== "undefined"
    ? localStorage.getItem("userId")
    : '';

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
  function formatNotificationMessage(message: string, currentUserEmail: string) {
    return message.replace(currentUserEmail, "You");
  }
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

        {notificationsQuery.isLoading ? (
          <NotificationsSkeleton />
        ) : (
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
                              {notification?.userId === userId ? formatNotificationMessage(notification?.message, notification?.user?.email) : notification?.message}
                            </p>
                          </div>
                          {!notification?.isRead && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7189D0] opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#7189D0]" />
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xs text-[#9ca3af]">
                            {notification?.createdAt
                              ? new Date(
                                  notification?.createdAt,
                                ).toLocaleString()
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
        )}
      </SheetContent>
    </Sheet>
  );
}
