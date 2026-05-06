"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  getWorkspaceMembers,
  addMember,
  removeMember,
  updateMemberRole,
  getAllUsers,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { MembersTable } from "@/components/members-table";
import { InviteMemberModal } from "@/components/invite-member-modal";
import { useToast } from "@/hooks/useToast";

export default function WorkspacePage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  // 👥 members
  const { data } = useQuery({
    queryKey: ["members", id],
    queryFn: () => getWorkspaceMembers(id as string),
  });

  // 👤 users
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  const members = data?.members ?? [];
  const users = usersData?.users ?? [];

  const isAdmin = members.find((m: { role: string }) => m.role === "ADMIN");

  const addMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      addMember(id as string, { userId, role }),
    onSuccess: (data: any) => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["members", id] });
      toast.success("", {
        description: data.message,
      });
    },
    onError: (error: Error) => {
      setOpen(false);
      toast.error("", {
        description: error.message,
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(id as string, userId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["members", id] });
      toast.success("", {
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast.error("", {
        description: error.message,
      });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateMemberRole(id as string, { userId, role }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["members", id] });
      toast.success("", {
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast.error("", {
        description: error.message,
      });
    },
  });

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Workspace Members
            </h1>
            <p className="text-sm text-slate-500">
              Manage access and roles for this workspace
            </p>
          </div>

          <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
            Invite Member
          </Button>
        </div>

        {/* Table Wrapper */}
        <div className="w-full rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto">
            <MembersTable
              members={members}
              isAdmin={!!isAdmin}
              onRemove={(userId: string) => removeMutation.mutate(userId)}
              onRoleChange={(userId: string, role: string) =>
                roleMutation.mutate({ userId, role })
              }
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      <InviteMemberModal
        open={open}
        onClose={() => setOpen(false)}
        users={users}
        onInvite={(userId: string, role: string) =>
          addMutation.mutate({ userId, role })
        }
        isLoading = {addMutation.isPending}
      />
    </div>
  );
}
