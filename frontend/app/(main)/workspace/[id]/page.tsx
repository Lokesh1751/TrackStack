"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";

import { getWorkspaceById, getWorkspaceMembers, getProjects } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { WorkspacePageSkeleton } from "@/components/skeleton/workspace";
import { ImageWithFallback } from "@/components/image-fallback";

export default function Workspace() {
  const { id } = useParams();

  const router = useRouter();

  // =========================
  // WORKSPACE DETAILS
  // =========================
  const { data, isLoading } = useQuery({
    queryKey: ["workspace", id],

    queryFn: () => getWorkspaceById(id as string),
  });

  // =========================
  // MEMBERS
  // =========================
  const { data: membersData } = useQuery({
    queryKey: ["workspace-members", id],

    queryFn: () => getWorkspaceMembers(id as string),
  });

  // =========================
  // PROJECTS
  // =========================
  const { data: projectsData } = useQuery({
    queryKey: ["projects", id],

    queryFn: () => getProjects(id as string),
  });

  const workspace = data?.workspace;

  const members = membersData?.members || [];
  const filteredMembers = members.filter((member:any) => !member.isSuperAdmin)

  const projects = projectsData?.projects || [];

  if (isLoading) {
    return <WorkspacePageSkeleton/>
  }

  if (!workspace) {
    return (
      <div className="h-screen flex items-center justify-center">
        Workspace not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700" />

          <div className="px-8 pb-8">
            <div className="-mt-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              {/* LEFT */}
              <div className="flex items-end gap-5">
                <div className="h-28 w-28 rounded-3xl border-4 border-white bg-white overflow-hidden shadow-md flex items-center justify-center">
                  {workspace.logoUrl ? (
                    <ImageWithFallback
                      src={workspace.logoUrl}
                      alt="workspace-logo"
                      width={112}
                      height={112}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-400 text-sm">No Logo</span>
                  )}
                </div>

                <div className="mb-4">
                  <span className="flex gap-3 items-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                      {workspace.name}
                    </h1>

                    <p className="text-sm text-white">
                      ({workspace.description || "No workspace description"})
                    </p>
                  </span>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-medium border">
                      {workspace.slug}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                      {workspace.role}
                    </span>

                    {workspace.isSuperAdmin && (
                      <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                        SUPER ADMIN ACCESS
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/workspace/${id}/projects`)}
                >
                  View Projects
                </Button>

                {(workspace.role === "ADMIN" ||
                  workspace.role === "SUPER_ADMIN") && (
                  <Button onClick={() => router.push(`/workspace/${id}/edit`)}>
                    Edit Workspace
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <p className="text-sm text-slate-500">Total Members</p>

            <h2 className="text-3xl font-bold mt-2">{members.length}</h2>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <p className="text-sm text-slate-500">Total Projects</p>

            <h2 className="text-3xl font-bold mt-2">{projects.length}</h2>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <p className="text-sm text-slate-500">Created At</p>

            <h2 className="text-xl font-semibold mt-2">
              {new Date(workspace.createdAt).toLocaleDateString()}
            </h2>
          </div>
        </div>

        {/* WORKSPACE DETAILS */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-semibold">Workspace Details</h2>

            <p className="text-sm text-slate-500 mt-1">
              General information about this workspace
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Workspace Name
              </p>

              <p className="font-semibold text-lg">{workspace.name}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Slug
              </p>

              <p className="font-medium">{workspace.slug}</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Description
              </p>

              <p className="text-slate-700 leading-relaxed">
                {workspace.description || "No description available"}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Your Role
              </p>

              <p className="font-medium">{workspace.role}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Last Updated
              </p>

              <p className="font-medium">
                {new Date(workspace.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* MEMBERS */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="border-b px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Workspace Members</h2>

              <p className="text-sm text-slate-500 mt-1">
                Users who are part of this workspace
              </p>
            </div>

            {(workspace.role === "ADMIN" ||
              workspace.role === "SUPER_ADMIN") && (
              <Button
                variant="outline"
                onClick={() => router.push(`/workspace/${id}/edit`)}
              >
                Manage Members
              </Button>
            )}
          </div>

          {filteredMembers.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No members found</div>
          ) : (
            <div className="divide-y">
              {filteredMembers.map((member: any) => (
                <div
                  key={member.userId}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{member.email}</p>
                  </div>

                  <div>

                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        {member.role}
                      </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PROJECTS */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="border-b px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Projects</h2>

              <p className="text-sm text-slate-500 mt-1">
                Projects inside this workspace
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => router.push(`/workspace/${id}/projects`)}
            >
              Open Projects
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No projects found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-6">
              {projects.map((project: any) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/tasks/${project.id}`)}
                  className="border rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition cursor-pointer bg-slate-50"
                >
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{project.name}</h3>

                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {project.description || "No description"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>

                      <span>Open →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
