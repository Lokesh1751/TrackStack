"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import {
  acceptProjectInvite,
  declineProjectInvite,
  acceptWorkspaceInvite,
  declineWorkspaceInvite,
} from "@/lib/api";

import { toast } from "sonner";

import {
  CheckCircle2,
  XCircle,
  Users,
  MailOpen,
  Sparkles,
  FolderKanban,
  Building2,
} from "lucide-react";

export default function InvitationPage() {
  const { token } = useParams();

  const searchParams = useSearchParams();

  const router = useRouter();

  // =================================================
  // DETECT INVITATION TYPE
  // =================================================

  const projectName = searchParams.get("projectName");

  const workspaceName = searchParams.get("workspaceName");

  const isProjectInvite = !!projectName;

  const entityName = projectName || workspaceName || "TrackStack";

  // =================================================
  // ACCEPT
  // =================================================

  const acceptMutation = useMutation({
    mutationFn: () => {
      if (isProjectInvite) {
        return acceptProjectInvite(token as string);
      }

      return acceptWorkspaceInvite(token as string);
    },

    onSuccess: (data) => {
      toast.success(data.message || "Invitation accepted");

      setTimeout(() => {
        router.push("/");
      }, 1500);
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to accept invitation",
      );
    },
  });

  // =================================================
  // DECLINE
  // =================================================

  const declineMutation = useMutation({
    mutationFn: () => {
      if (isProjectInvite) {
        return declineProjectInvite(token as string);
      }

      return declineWorkspaceInvite(token as string);
    },

    onSuccess: (data) => {
      toast.success(data.message || "Invitation declined");

      setTimeout(() => {
        router.push("/");
      }, 1500);
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to decline invitation",
      );
    },
  });

  const isLoading =
    acceptMutation.isPending || declineMutation.isPending;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fb] px-4 py-10">
      {/* ================================================= */}
      {/* BACKGROUND */}
      {/* ================================================= */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(113,137,208,0.15),transparent_35%)]" />

      <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#7189D0]/10 blur-[120px]" />

      {/* ================================================= */}
      {/* CARD */}
      {/* ================================================= */}

      <div className="relative w-full max-w-2xl overflow-hidden rounded-[36px] border border-[#e4e9f3] bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="relative overflow-hidden bg-gradient-to-br from-[#7189D0] via-[#7f93d6] to-[#8EA3E2] px-8 py-12 text-white">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              TrackStack Invitation
            </div>

            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-xl">
                {isProjectInvite ? (
                  <FolderKanban className="h-10 w-10" />
                ) : (
                  <Building2 className="h-10 w-10" />
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-4xl font-black tracking-tight">
                  {isProjectInvite
                    ? "Project Invitation"
                    : "Workspace Invitation"}
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-7 text-white/85">
                  You have been invited to join{" "}
                  <span className="font-bold text-white">
                    {entityName}
                  </span>{" "}
                  on TrackStack and collaborate with your team.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* BODY */}
        {/* ================================================= */}

        <div className="p-8 md:p-10">
          {/* ICON */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#f3f6ff] shadow-inner">
              <MailOpen className="h-11 w-11 text-[#7189D0]" />
            </div>
          </div>

          {/* TEXT */}
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-[#111827]">
              {isProjectInvite
                ? "Collaborate On Tasks & Sprints"
                : "Join Your Workspace Team"}
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[#6b7280]">
              {isProjectInvite
                ? "Accept this invitation to access project boards, collaborate through task comments, manage sprint work and contribute with your team members."
                : "Accept this invitation to become part of the workspace, access shared projects, collaborate with teams and participate in agile workflows."}
            </p>
          </div>

          {/* ================================================= */}
          {/* FEATURE CARDS */}
          {/* ================================================= */}

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-[#edf1f7] bg-[#fafbff] p-5 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7189D0]/10">
                <FolderKanban className="h-6 w-6 text-[#7189D0]" />
              </div>

              <h3 className="text-lg font-bold text-[#111827]">
                Tasks
              </h3>

              <p className="mt-2 text-xs leading-6 text-[#6b7280]">
                Manage project tasks and agile workflows
              </p>
            </div>

            <div className="rounded-3xl border border-[#edf1f7] bg-[#fafbff] p-5 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7189D0]/10">
                <Sparkles className="h-6 w-6 text-[#7189D0]" />
              </div>

              <h3 className="text-lg font-bold text-[#111827]">
                Sprints
              </h3>

              <p className="mt-2 text-xs leading-6 text-[#6b7280]">
                Plan, manage and track sprint delivery
              </p>
            </div>

            <div className="rounded-3xl border border-[#edf1f7] bg-[#fafbff] p-5 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7189D0]/10">
                <Users className="h-6 w-6 text-[#7189D0]" />
              </div>

              <h3 className="text-lg font-bold text-[#111827]">
                Teamwork
              </h3>

              <p className="mt-2 text-xs leading-6 text-[#6b7280]">
                Collaborate with your organization members
              </p>
            </div>
          </div>

          {/* ================================================= */}
          {/* INVITE SUMMARY */}
          {/* ================================================= */}

          <div className="mt-10 rounded-[28px] border border-[#e8edf6] bg-[#fafcff] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7189D0]">
                  Invitation For
                </p>

                <h3 className="mt-2 text-2xl font-black text-[#111827]">
                  {entityName}
                </h3>
              </div>

              <div className="rounded-2xl bg-[#7189D0]/10 px-4 py-2 text-sm font-semibold text-[#7189D0]">
                {isProjectInvite ? "PROJECT" : "WORKSPACE"}
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* ACTIONS */}
          {/* ================================================= */}

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button
              disabled={isLoading}
              onClick={() => acceptMutation.mutate()}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#7189D0] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[#7189D0]/20 transition hover:bg-[#6279bc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-5 w-5" />

              {acceptMutation.isPending
                ? "Accepting..."
                : "Accept Invitation"}
            </button>

            <button
              disabled={isLoading}
              onClick={() => declineMutation.mutate()}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle className="h-5 w-5" />

              {declineMutation.isPending
                ? "Declining..."
                : "Decline Invitation"}
            </button>
          </div>

          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          <div className="mt-8 border-t border-[#edf1f7] pt-6 text-center">
            <p className="text-xs text-[#9ca3af]">
              This invitation may expire after 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}