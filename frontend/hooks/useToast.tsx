"use client";

import React from "react";
import { toast } from "sonner";

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastOptions = {
  description?: string;
  duration?: number;
  action?: ToastAction;
};

export const useToast = () => {
  const defaultDuration = 3000;

  return {
    success: (title: string, options?: ToastOptions) =>
      toast.success(title, {
        description: options?.description,
        duration: options?.duration ?? defaultDuration,
        action: options?.action,
      }),

    error: (title: string, options?: ToastOptions) =>
      toast.error(title, {
        description: options?.description,
        duration: options?.duration ?? 4000,
        action: options?.action,
      }),

    warning: (title: string, options?: ToastOptions) =>
      toast.warning(title, {
        description: options?.description,
        duration: options?.duration ?? defaultDuration,
        action: options?.action,
      }),

    info: (title: string, options?: ToastOptions) =>
      toast.info(title, {
        description: options?.description,
        duration: options?.duration ?? defaultDuration,
        action: options?.action,
      }),

    loading: (title: string, options?: ToastOptions) =>
      toast.loading(title, {
        description: options?.description,
      }),

    dismiss: (id?: string | number) => {
      toast.dismiss(id);
    },

    custom: (
      jsx: (id: string | number) => React.ReactElement,
      options?: {
        duration?: number;
      },
    ) =>
      toast.custom(jsx, {
        duration: options?.duration ?? 5000,
      }),

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