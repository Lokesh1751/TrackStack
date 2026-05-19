"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import { acceptProjectInvite, declineProjectInvite } from "@/lib/api";

import { toast } from "sonner";

import { CheckCircle2, XCircle, Users, MailOpen, Sparkles } from "lucide-react";

export default function InvitationPage() {
  const { token } = useParams();
  const searchParams = useSearchParams();
  const projectName = searchParams.get('projectName')

  const router = useRouter();

  // =========================
  // ACCEPT
  // =========================

  const acceptMutation = useMutation({
    mutationFn: () => acceptProjectInvite(token as string),

    onSuccess: (data) => {
      toast.success(data.message || "Invitation accepted");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to accept invitation",
      );
    },
  });

  // =========================
  // DECLINE
  // =========================

  const declineMutation = useMutation({
    mutationFn: () => declineProjectInvite(token as string),

    onSuccess: (data) => {
      toast.success(data.message || "Invitation declined");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to decline invitation",
      );
    },
  });

  const isLoading = acceptMutation.isPending || declineMutation.isPending;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-100 px-4 py-10">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.05),transparent_40%)]" />

      {/* CARD */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-2xl">
        {/* TOP SECTION */}
        <div className="relative overflow-hidden bg-black px-8 py-10 text-white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />

          <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/5" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Users className="h-8 w-8" />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-neutral-300">
                <Sparkles className="h-4 w-4" />

                <span>TrackStack Collaboration</span>
              </div>

              <h1 className="text-3xl font-bold">Project Invitation for {projectName}</h1>

              <p className="mt-2 text-sm leading-6 text-neutral-300">
                You have been invited to collaborate on a project.
              </p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-8">
          {/* ICON */}
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
              <MailOpen className="h-10 w-10 text-neutral-700" />
            </div>
          </div>

          {/* TEXT */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900">
              Join the Team
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-500">
              Accept the invitation to become part of the project workspace and
              start collaborating with your team on tasks, sprints, and project
              delivery.
            </p>
          </div>

          {/* FEATURES */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center">
              <div className="text-lg font-bold text-neutral-900">Tasks</div>

              <div className="mt-1 text-xs text-neutral-500">Manage work</div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center">
              <div className="text-lg font-bold text-neutral-900">Sprints</div>

              <div className="mt-1 text-xs text-neutral-500">
                Agile planning
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center">
              <div className="text-lg font-bold text-neutral-900">Teamwork</div>

              <div className="mt-1 text-xs text-neutral-500">Collaborate</div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button
              disabled={isLoading}
              onClick={() => acceptMutation.mutate()}
              className="flex flex-1 items-center justify-center cursor-pointer gap-2 rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-5 w-5" />

              {acceptMutation.isPending
                ? "Accepting Invitation..."
                : "Accept Invitation"}
            </button>

            <button
              disabled={isLoading}
              onClick={() => declineMutation.mutate()}
              className="flex flex-1 items-center cursor-pointer justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle className="h-5 w-5" />

              {declineMutation.isPending ? "Declining..." : "Decline"}
            </button>
          </div>

          {/* FOOTER */}
          <div className="mt-8 border-t border-neutral-100 pt-5 text-center">
            <p className="text-xs text-neutral-400">
              This invitation may expire after 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
