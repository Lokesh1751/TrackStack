"use client";

import { toast } from "sonner";

type ToastOptions = {
  description?: string;
  duration?: number;
};

export const useToast = () => {
  return {
    success: (title: string, options?: ToastOptions) =>
      toast.success(title, {
        description: options?.description,
        duration: options?.duration ?? 3000,
      }),

    error: (title: string, options?: ToastOptions) =>
      toast.error(title, {
        description: options?.description,
        duration: options?.duration ?? 4000,
      }),

    warning: (title: string, options?: ToastOptions) =>
      toast(title, {
        description: options?.description,
        duration: options?.duration ?? 4000,
        style: {
          background: "#f59e0b", // amber
          color: "#fff",
        },
      }),

    info: (title: string, options?: ToastOptions) =>
      toast(title, {
        description: options?.description,
        duration: options?.duration ?? 3000,
        style: {
          background: "#3b82f6", // blue
          color: "#fff",
        },
      }),

    loading: (title: string, options?: ToastOptions) =>
      toast.loading(title, {
        description: options?.description,
      }),

    dismiss: (id?: string | number) => toast.dismiss(id),

    promise: <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: Error) => string);
      },
    ) =>
      toast.promise(promise, {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      }),
  };
};
