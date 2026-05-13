"use client";

import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  getWorkspaces,
  deleteWorkspace,
  createWorkspace,
  logout,
  addMember,
  getAllUsers,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/columns/data-table";
import { getColumns } from "@/components/columns/workspace-columns";
import { useToast } from "@/hooks/useToast";
import { DashboardPageSkeleton } from "@/components/skeleton/dashboard";

type WorkspaceRole = "ADMIN" | "MEMBER";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  // ✅ GLOBAL ACCESS
  const isSuperAdmin =
    typeof window !== "undefined"
      ? localStorage.getItem("isSuperAdmin") === "true"
      : false;

  const [open, setOpen] = useState(false);

  // ✅ invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>("MEMBER");

  // ✅ create workspace form
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // =========================
  // WORKSPACES
  // =========================
  const { data, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
    staleTime: 0,
    refetchOnMount: true,
  });

  const workspaces = data?.workspaces ?? [];

  // =========================
  // USERS
  // =========================
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
    enabled: inviteOpen,
  });

  const users = usersData?.users ?? [];

  // =========================
  // AUTO SLUG
  // =========================
  const generatedSlug = useMemo(() => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }, [name]);

  useEffect(() => {
    setSlug(generatedSlug );
  }, [generatedSlug]);

  // =========================
  // DELETE WORKSPACE
  // =========================
  const deleteMutation = useMutation({
    mutationFn: deleteWorkspace,

    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({
        queryKey: ["workspaces"],
      });

      toast.success("Workspace deleted", {
        description: data.message,
      });
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // CREATE WORKSPACE
  // =========================
  const createMutation = useMutation({
    mutationFn: createWorkspace,

    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({
        queryKey: ["workspaces"],
      });

      setOpen(false);

      setName("");
      setSlug("");
      setDescription("");
      setLogoUrl("");

      toast.success("Workspace created", {
        description: data.message,
      });
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // INVITE MEMBER
  // =========================
  const inviteMutation = useMutation({
    mutationFn: ({
      workspaceId,
      payload,
    }: {
      workspaceId: string;
      payload: {
        userId: string;
        role: WorkspaceRole;
      };
    }) => addMember(workspaceId, payload),

    onSuccess: (data: { message: string }) => {
      toast.success("Member invited", {
        description: data.message,
      });

      setInviteOpen(false);
      setSelectedUserId("");
      setSelectedRole("MEMBER");
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // LOGO UPLOAD
  // =========================
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setLogoUrl(imageUrl);
  };

  return (
    <div className=" bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>

            <p className="text-sm text-slate-500 mt-1">
              Create and manage your organization workspaces
            </p>
          </div>
        </div>

        {/* LOADING */}
        {!data && isLoading ? (
           <DashboardPageSkeleton />
        ) : workspaces.length === 0 ? (
          // EMPTY
          <div className="bg-white border rounded-2xl p-12 text-center shadow-sm">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">No workspaces found</h2>

              <p className="text-sm text-slate-500">
                {isSuperAdmin
                  ? "Create your first workspace to start managing projects"
                  : "You are not added to any workspace yet. Contact your administrator."}
              </p>

            </div>
          </div>
        ) : (
          // TABLE
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold text-lg">Your Workspaces</h2>
            </div>

            <div className="overflow-x-auto">
              <DataTable
                data={workspaces}
                columns={getColumns(
                  (workspaceId: string | undefined) =>
                    router.push(`/workspace/${workspaceId}/edit`),

                  (workspaceId: string) => deleteMutation.mutate(workspaceId),

                  deleteMutation.isPending,

                  (workspaceId: string) => {
                    setSelectedWorkspaceId(workspaceId);
                    setInviteOpen(true);
                  },

                  isSuperAdmin,
                  (workspaceId: string) => {
                    router.push(`/workspace/${workspaceId}/projects`);
                  },
                )}
                onRowClick={(row: { id: string; role: WorkspaceRole }) => {
                  router.push(`/workspace/${row.id}`);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* CREATE WORKSPACE MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold">Create Workspace</h2>

              <p className="text-sm text-slate-500 mt-1">
                Add workspace details and branding
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* LOGO */}
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-2xl border bg-slate-100 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="logo"
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No Logo</span>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />

                  <p className="text-xs text-slate-500">
                    Upload workspace logo
                  </p>
                </div>
              </div>

              {/* NAME */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace Name</label>

                <input
                  className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="Acme Inc"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* SLUG */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace Slug</label>

                <input
                  className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="acme-inc"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>

                <textarea
                  rows={4}
                  className="w-full border rounded-xl p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-black/10"
                  placeholder="Describe your workspace..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>

              <Button
                disabled={!name || !slug || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    name,
                    slug,
                    description,
                    logoUrl,
                  })
                }
              >
                {createMutation.isPending ? "Creating..." : "Create Workspace"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold">Invite Member</h2>

              <p className="text-sm text-slate-500 mt-1">
                Add user to workspace
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* USER */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select User</label>

                <select
                  className="w-full border rounded-xl p-3 text-sm"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Select user</option>

                  {users.map((user: { id: string; email: string }) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* ROLE */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace Role</label>

                <select
                  className="w-full border rounded-xl p-3 text-sm"
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as WorkspaceRole)
                  }
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MEMBER">MEMBER</option>
                </select>
              </div>
            </div>

            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>

              <Button
                disabled={!selectedUserId || inviteMutation.isPending}
                onClick={() =>
                  inviteMutation.mutate({
                    workspaceId: selectedWorkspaceId,

                    payload: {
                      userId: selectedUserId,
                      role: selectedRole,
                    },
                  })
                }
              >
                {inviteMutation.isPending ? "Inviting..." : "Invite Member"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
