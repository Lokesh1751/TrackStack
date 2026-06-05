"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import {getRedirectUrl} from "@/helpers"
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { Bell } from "lucide-react";
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userId = localStorage.getItem("userId");

    if (!userId) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "";

    const socketInstance = io(socketUrl, {
      auth: {
        userId,
      },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("notification", (notification: any) => {

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });

       toast.custom((id) => (
    <div className="flex min-w-[350px] items-start gap-3 rounded-2xl border bg-white p-4 shadow-lg">
      <div className="rounded-full bg-blue-100 p-2">
        <Bell className="h-4 w-4 text-blue-600" />
      </div>

      <div className="flex-1">
        <p className="font-semibold text-sm">
          {notification.title}
        </p>

        <p className="mt-1 text-xs text-neutral-500">
          {notification.message}
        </p>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              const url = getRedirectUrl(notification);

              if (url !== "#") {
                router.push(url);
              }

              toast.dismiss(id);
            }}
            className="rounded-lg bg-[#7189D0] px-3 py-1 text-xs text-white"
          >
            View
          </button>

          <button
            onClick={() => toast.dismiss(id)}
            className="rounded-lg border px-3 py-1 text-xs"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  ));

    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [queryClient, router]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
