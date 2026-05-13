"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createProject,
  getProjects,
  getWorkspaceById,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getWorkspaceMembers,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { ProjectsPageSkeleton } from "@/components/skeleton/projects";
import { useToast } from "@/hooks/useToast";

export default function Projects() {
  const { id: workspaceId } = useParams();

  const router = useRouter();

  const toast = useToast();

  const queryClient = useQueryClient();

  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [selectedMemberEmail, setSelectedMemberEmail] = useState("");

  // =========================
  // GET WORKSPACE
  // =========================
  const { data: workspaceData } = useQuery({
    queryKey: ["workspace", workspaceId],

    queryFn: () => getWorkspaceById(workspaceId as string),
  });

  const currentRole = workspaceData?.workspace?.role;

  // =========================
  // GET WORKSPACE MEMBERS
  // =========================
  const { data: workspaceMembersData } = useQuery({
    queryKey: ["workspace-members", workspaceId],

    queryFn: () => getWorkspaceMembers(workspaceId as string),
  });

  const workspaceMembers = workspaceMembersData?.members || [];

  // =========================
  // GET PROJECTS
  // =========================
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects", workspaceId],

    queryFn: () => getProjects(workspaceId as string),
  });

  const projects = projectsData?.projects || [];

  // =========================
  // GET PROJECT MEMBERS
  // =========================
  const { data: membersData } = useQuery({
    queryKey: ["project-members", selectedProjectId],

    queryFn: () => getProjectMembers(selectedProjectId),

    enabled: !!selectedProjectId,
  });

  const projectMembers = membersData?.members || [];

  const projectMemberEmails = projectMembers.map((member: any) => member.email);

  const availableMembers = workspaceMembers.filter(
    (member: any) =>
      !projectMemberEmails.includes(member.email) && !member.isSuperAdmin,
  );
  console.log("availablemembers", availableMembers);

  // =========================
  // CREATE PROJECT
  // =========================
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      createProject(workspaceId as string, payload),

    onSuccess: (data: any) => {
      toast.success("Project created", {
        description: data.message,
      });

      setName("");
      setDescription("");

      queryClient.invalidateQueries({
        queryKey: ["projects", workspaceId],
      });
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // DELETE PROJECT
  // =========================
  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),

    onSuccess: (data: any) => {
      toast.success("Project deleted", {
        description: data.message,
      });

      queryClient.invalidateQueries({
        queryKey: ["projects", workspaceId],
      });
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // ADD PROJECT MEMBER
  // =========================
  const inviteMutation = useMutation({
    mutationFn: (payload: { projectId: string; email: string }) =>
      addProjectMember(payload.projectId, {
        email: payload.email,
      }),

    onSuccess: () => {
      toast.success("Member invited");

      setSelectedMemberEmail("");

      queryClient.invalidateQueries({
        queryKey: ["project-members", selectedProjectId],
      });
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  // =========================
  // REMOVE PROJECT MEMBER
  // =========================
  const removeMemberMutation = useMutation({
    mutationFn: ({
      projectId,
      userId,
    }: {
      projectId: string;
      userId: string;
    }) => removeProjectMember(projectId, userId),

    onSuccess: () => {
      toast.success("Member removed");

      queryClient.invalidateQueries({
        queryKey: ["project-members", selectedProjectId],
      });
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const canManageProjects =
    currentRole === "SUPER_ADMIN" || currentRole === "ADMIN";

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h1 className="text-3xl font-semibold">Workspace Projects</h1>

          <p className="text-sm text-slate-500 mt-2">
            Manage projects inside this workspace
          </p>
        </div>

        {/* Create Project */}
        {canManageProjects && (
          <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Create Project</h2>

              <p className="text-sm text-slate-500 mt-1">
                Add a new project to this workspace
              </p>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project name"
                  className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>

                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Project description"
                  className="w-full border rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  disabled={!name || createMutation.isPending}
                  onClick={() =>
                    createMutation.mutate({
                      name,
                      description,
                    })
                  }
                >
                  {createMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Projects Table */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-semibold">Projects</h2>

            <p className="text-sm text-slate-500 mt-1">
              All projects inside this workspace
            </p>
          </div>

          {isLoading ? (
    <ProjectsPageSkeleton/>
          ) : projects.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No projects found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium">
                      Name
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-medium">
                      Description
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-medium">
                      Created
                    </th>

                    {canManageProjects && (
                      <th className="text-right px-6 py-4 text-sm font-medium">
                        Actions
                      </th>
                    )}
                    <th className="text-left px-6 py-4 text-sm font-medium">
                      Sprint
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {projects.map((project: any) => (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td
                        className="px-6 py-4 font-medium"
                        onClick={() => router.push(`/tasks/${project.id}?sprint=${project?.activeSprint?.id}`)}
                      >
                        {project.name}
                      </td>

                      <td
                        className="px-6 py-4 text-sm text-slate-600"
                        onClick={() => router.push(`/tasks/${project.id}?sprint=${project?.activeSprint?.id}`)}
                      >
                        {project.description || "No description"}
                      </td>

                      <td
                        className="px-6 py-4 text-sm text-slate-500"
                        onClick={() => router.push(`/tasks/${project.id}?sprint=${project?.activeSprint?.id}`)}
                      >
                        {new Date(project.createdAt).toLocaleDateString()}
                      </td>

                      {canManageProjects && (
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProjectId(project.id);
                            }}
                          >
                            Members
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(project.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      )}

                      <td>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/sprint/${project.id}`)}
                        >
                          Sprints
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Project Members */}
        {selectedProjectId && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="border-b px-6 py-5">
              <h2 className="text-xl font-semibold">Project Members</h2>

              <p className="text-sm text-slate-500 mt-1">
                Invite and manage project members
              </p>
            </div>

            {/* Invite Form */}
            {canManageProjects && (
              <div className="p-6 border-b space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={selectedMemberEmail}
                    onChange={(e) => setSelectedMemberEmail(e.target.value)}
                    className="border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  >
                    <option value="">Select workspace member</option>

                    {availableMembers.map((member: any) => (
                      <option key={member.userId} value={member.email}>
                        {member.email}
                      </option>
                    ))}
                  </select>

                  <Button
                    disabled={!selectedMemberEmail || inviteMutation.isPending}
                    onClick={() =>
                      inviteMutation.mutate({
                        projectId: selectedProjectId,
                        email: selectedMemberEmail,
                      })
                    }
                  >
                    {inviteMutation.isPending ? "Inviting..." : "Invite Member"}
                  </Button>
                </div>
              </div>
            )}

            {/* Members List */}
            {projectMembers.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No project members found
              </div>
            ) : (
              <div className="divide-y">
                {projectMembers.map((member: any) => (
                  <div
                    key={member.userId}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{member.email}</p>

                      <p className="text-xs text-slate-500 mt-1">
                        {member.role}
                      </p>
                    </div>

                    {canManageProjects && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={removeMemberMutation.isPending}
                        onClick={() =>
                          removeMemberMutation.mutate({
                            projectId: selectedProjectId,
                            userId: member.userId,
                          })
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
