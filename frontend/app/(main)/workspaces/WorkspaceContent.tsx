
"use client";
export const dynamic = "force-dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Suspense } from "react";

import {
  getWorkspaces,
  deleteWorkspace,
  createWorkspace,
  addMember,
  getAllUsers,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/columns/data-table";
import { getColumns } from "@/components/columns/workspace-columns";
import { useToast } from "@/hooks/useToast";
import { DashboardPageSkeleton } from "@/components/skeleton/dashboard";
import { ImageWithFallback } from "@/components/image-fallback";
import { FilterBar } from "@/components/filters/FilterBar";

type WorkspaceRole = "ADMIN" | "MEMBER";

export default function DashboardPage({useQueryFilters}: {useQueryFilters: any}) {
  const router = useRouter();

  const queryClient = useQueryClient();

  const toast = useToast();

  const { get, set } = useQueryFilters();

  const role = get("role");

  const search = get("search");

  // =========================
  // GLOBAL ACCESS
  // =========================

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    setIsSuperAdmin(localStorage.getItem("isSuperAdmin") === "true");
  }, []);

  // =========================
  // MODALS
  // =========================

  const [open, setOpen] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);

  // =========================
  // INVITE STATES
  // =========================

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");

  const [selectedEmail, setSelectedEmail] = useState("");

  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>("MEMBER");

  // =========================
  // CREATE WORKSPACE FORM
  // =========================

  const [name, setName] = useState("");

  const [slug, setSlug] = useState("");

  const [description, setDescription] = useState("");

  const [logoUrl, setLogoUrl] = useState("");

  const [uploading, setUploading] = useState(false);

  // =========================
  // GET WORKSPACES
  // =========================

  const { data, isLoading } = useQuery({
    queryKey: ["workspaces", role, search],

    queryFn: () =>
      getWorkspaces({
        role: role === "ADMIN" || role === "MEMBER" ? role : undefined,

        search: search || undefined,
      }),
  });

  const workspaces = data?.workspaces ?? [];

  // =========================
  // GET USERS
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
    setSlug((prev) => {
      if (prev === generatedSlug) return prev;

      return generatedSlug;
    });
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

    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["workspaces"],
      });

      setOpen(false);

      setName("");
      setSlug("");
      setDescription("");
      setLogoUrl("");

      toast.success("Workspace created", {
        description: `Workspace "${data?.name}" created successfully!`,
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
        email: string;
        role: WorkspaceRole;
      };
    }) => addMember(workspaceId, payload),

    onSuccess: (data: { message: string }) => {
      toast.success("Member invited", {
        description: data.message,
      });

      setInviteOpen(false);

      setSelectedEmail("");

      setSelectedRole("MEMBER");
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // CLOUDINARY UPLOAD
  // =========================

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", file);

      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      // if (!res.ok) {
      //   throw new Error("Upload failed");
      // }

      const data = await res.json();


      setLogoUrl(data.secure_url);

      toast.success("Logo uploaded");
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="bg-slate-100">
        <div className="mx-auto space-y-6 px-4 py-8 md:px-6">
          {/* HEADER */}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>

              <p className="mt-1 text-sm text-slate-500">
                Create and manage your organization workspaces
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isSuperAdmin && (
                <Button onClick={() => setOpen(true)}>+ New Workspace</Button>
              )}
            </div>
          </div>

          {/* FILTERS */}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-gray-200 bg-white p-3">
            {!isSuperAdmin && (
              <FilterBar
                values={{
                  role: role || "",
                }}
                onChange={(key, value) => set(key, value)}
                filters={[
                  {
                    key: "role",
                    label: "Role",

                    options: [
                      {
                        label: "Admin",
                        value: "ADMIN",
                      },

                      {
                        label: "Member",
                        value: "MEMBER",
                      },
                    ],
                  },
                ]}
              />
            )}

            <input
              value={search}
              onChange={(e) => set("search", e.target.value)}
              placeholder="Search workspaces..."
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 md:w-72"
            />
          </div>

          {/* CONTENT */}

          {!data && isLoading ? (
            <DashboardPageSkeleton />
          ) : workspaces.length === 0 ? (
            <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
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
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-5 py-4">
                <h2 className="text-lg font-semibold">Your Workspaces</h2>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#7189D0]/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="border-b px-6 py-4">
                <h2 className="text-xl font-semibold">Create Workspace</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add workspace details and branding
                </p>
              </div>

              <div className="space-y-5 p-6">
                {/* LOGO */}

                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border bg-slate-100">
                    {logoUrl ? (
                      <ImageWithFallback
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
                      {uploading ? "Uploading..." : "Upload workspace logo"}
                    </p>
                  </div>
                </div>

                {/* NAME */}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Workspace Name</label>

                  <input
                    className="w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="Acme Inc"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* SLUG */}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Workspace Slug</label>

                  <input
                    className="w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
                    className="w-full resize-none rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="Describe your workspace..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t px-6 py-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>

                <Button
                  disabled={
                    !name || !slug || createMutation.isPending || uploading
                  }
                  onClick={() =>
                    createMutation.mutate({
                      name,
                      slug,
                      description,
                      logoUrl,
                    })
                  }
                >
                  {createMutation.isPending
                    ? "Creating..."
                    : "Create Workspace"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* INVITE MODAL */}

        {inviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="border-b px-6 py-4">
                <h2 className="text-xl font-semibold">Invite Member</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Send workspace invitation via email
                </p>
              </div>

              <div className="space-y-5 p-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select User</label>

                  <select
                    className="w-full rounded-xl border p-3 text-sm"
                    value={selectedEmail}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                  >
                    <option value="">Select user</option>

                    {users.map((user: { id: string; email: string }) => (
                      <option key={user.id} value={user.email}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Workspace Role</label>

                  <select
                    className="w-full rounded-xl border p-3 text-sm"
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

              <div className="flex justify-end gap-3 border-t px-6 py-4">
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>

                <Button
                  disabled={!selectedEmail || inviteMutation.isPending}
                  onClick={() =>
                    inviteMutation.mutate({
                      workspaceId: selectedWorkspaceId,

                      payload: {
                        email: selectedEmail,
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
    </Suspense>
  );
}
