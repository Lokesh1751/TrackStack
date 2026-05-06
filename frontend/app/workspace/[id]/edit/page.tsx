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

export default function WorkspacePage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);

  // 👥 members
  const { data } = useQuery({
    queryKey: ["members", id],
    queryFn: () => getWorkspaceMembers(id as string),
  });

  // 👤 all users (for dropdown)
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  const members = data?.members ?? [];
  const users = usersData?.users ?? [];

  // assume current user is admin (you can refine later)
  const isAdmin = members.find((m: any) => m.role === "ADMIN");

  // ➕ add
  const addMutation = useMutation({
    mutationFn: ({ userId, role }: any) =>
      addMember(id as string, { userId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", id] });
      setOpen(false);
    },
  });

  // ❌ remove
  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      removeMember(id as string, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", id] });
    },
  });

  // 🔁 role change
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: any) =>
      updateMemberRole(id as string, { userId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", id] });
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Workspace Members</h1>

        <Button onClick={() => setOpen(true)}>
          Invite Member
        </Button>
      </div>

      {/* Table */}
      <MembersTable
        members={members}
        isAdmin={!!isAdmin}
        onRemove={(userId: string) =>
          removeMutation.mutate(userId)
        }
        onRoleChange={(userId: string, role: string) =>
          roleMutation.mutate({ userId, role })
        }
      />

      {/* Modal */}
      <InviteMemberModal
        open={open}
        onClose={() => setOpen(false)}
        users={users}
        onInvite={(userId: string, role: string) =>
          addMutation.mutate({ userId, role })
        }
      />
    </div>
  );
}