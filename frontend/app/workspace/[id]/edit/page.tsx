"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import {
  getWorkspaceById,
  updateWorkspace,
  getWorkspaceMembers,
  removeMember,
  updateMemberRole,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

export default function EditWorkspacePage() {
  const { id } = useParams();

  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // ✅ fetch workspace
  const { data, isLoading } = useQuery({
    queryKey: ["workspace", id],
    queryFn: () => getWorkspaceById(id as string),
  });
  const currentRole = data?.workspace?.role;
  // ✅ fetch members
  const { data: membersData } = useQuery({
    queryKey: ["workspace-members", id],
    queryFn: () => getWorkspaceMembers(id as string),
  });

  const members = membersData?.members ?? [];
  const filteredMembers = members.filter((m: any) => m.isSuperAdmin === false);

  useEffect(() => {
    if (!data?.workspace) return;

    setName(data.workspace.name || "");
    setSlug(data.workspace.slug || "");
    setDescription(data.workspace.description || "");
    setLogoUrl(data.workspace.logoUrl || "");
  }, [data]);

  // ✅ update workspace mutation
  const updateMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      slug: string;
      description?: string;
      logoUrl?: string;
    }) => updateWorkspace(id as string, payload),

    onSuccess: (data: any) => {
      toast.success("Workspace updated", {
        description: data.message,
      });

      queryClient.invalidateQueries({
        queryKey: ["workspace", id],
      });

      queryClient.invalidateQueries({
        queryKey: ["workspaces"],
      });

      router.push("/dashboard");
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // ✅ remove member
  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(id as string, userId),

    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", id],
      });

      toast.success("Member removed", {
        description: data.message,
      });
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // ✅ update member role
  const updateRoleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
    }) => updateMemberRole(id as string, {
      userId: userId,
      role: role,
    }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", id],
      });

      queryClient.invalidateQueries({
        queryKey: ["workspaces"],
      });

      toast.success("Role updated", {
        description: data.message,
      });
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // ✅ upload image
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const localUrl = URL.createObjectURL(file);

    setLogoUrl(localUrl);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Workspace Card */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b px-6 py-5">
            <h1 className="text-2xl font-semibold">Edit Workspace</h1>

            <p className="text-sm text-slate-500 mt-1">
              Update workspace details and branding
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-5">
              <div className="h-24 w-24 rounded-2xl border overflow-hidden bg-slate-100 flex items-center justify-center">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="logo"
                    width={96}
                    height={96}
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

                <p className="text-xs text-slate-500">Upload workspace logo</p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace Name</label>

              <input
                className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Workspace name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>

              <input
                className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="workspace-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />

              <p className="text-xs text-slate-500">Used in workspace URLs</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>

              <textarea
                rows={5}
                className="w-full border rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Workspace description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>

            <Button
              disabled={!name || !slug || updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  name,
                  slug,
                  description,
                  logoUrl,
                })
              }
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Members */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-semibold">Workspace Members</h2>

            <p className="text-sm text-slate-500 mt-1">
              Manage workspace users and access
            </p>
          </div>

          <div className="divide-y">
            {filteredMembers.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No members found</div>
            ) : (
              filteredMembers.map((member: any) => (
                <div
                  key={member.userId}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{member.email}</p>

                    <div className="mt-2">
                      {currentRole === "SUPER_ADMIN" ||
                      currentRole === "ADMIN" ? (
                        <select
                          value={member.role}
                          className="border rounded-lg px-2 py-1 text-xs"
                          onChange={(e) =>
                            updateRoleMutation.mutate({
                              userId: member.userId,
                              role: e.target.value as
                                | "SUPER_ADMIN"
                                | "ADMIN"
                                | "MEMBER",
                            })
                          }
                        >
                          <option value="MEMBER">MEMBER</option>

                          <option value="ADMIN">ADMIN</option>

                          {currentRole === "SUPER_ADMIN" && (
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          )}
                        </select>
                      ) : (
                        <p className="text-xs text-slate-500">{member.role}</p>
                      )}
                    </div>
                  </div>

                  {(currentRole === "SUPER_ADMIN" ||
                    currentRole === "ADMIN") && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        removeMutation.isPending || updateRoleMutation.isPending
                      }
                      onClick={() => removeMutation.mutate(member.userId)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
