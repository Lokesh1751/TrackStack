"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getCurrentUser, updateProfile } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/image-fallback";
import { ProfilePageSkeleton } from "@/components/skeleton/profile";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const router = useRouter();

  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getCurrentUser,
  });

  const user = data?.data;

  const [name, setName] = useState("");

  const [bio, setBio] = useState("");

  const [designation, setDesignation] = useState("");

  const [timezone, setTimezone] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");

const [isEditing, setIsEditing] = useState(false);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setName(user.name || "");

    setBio(user.bio || "");

    setDesignation(user.designation || "");

    setTimezone(user.timezone || "");

    setAvatarUrl(user.avatarUrl || "");
  }, [user]);

  // =========================
  // UPDATE PROFILE
  // =========================

  const updateMutation = useMutation({
    mutationFn: updateProfile,

    onSuccess: (response: any) => {
      queryClient.invalidateQueries({
        queryKey: ["profile"],
      });

      toast.success(response?.message || "Profile updated");

      setIsEditing(false);
    },

    onError: (error: any) => {
      toast.error(error?.message || "Failed to update profile");
    },
  });

  // =========================
  // CLOUDINARY IMAGE UPLOAD
  // =========================

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", file);

      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "Upload failed");
      }

      setAvatarUrl(data.secure_url);

      toast.success("Avatar uploaded");
    } catch (error: any) {
      toast.error(error?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto space-y-6 px-4 py-8 md:px-6">
        {/* PROFILE HEADER */}

        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="h-40 bg-gradient-to-r from-slate-900 to-slate-700" />

          <div className="px-8 pb-8">
            <div className="-mt-16 flex flex-col gap-8 lg:flex-row">
              {/* AVATAR */}

              <div className="space-y-4">
                <div className="h-32 w-32 overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-lg">
                  {avatarUrl ? (
                    <ImageWithFallback
                      src={avatarUrl}
                      alt="avatar"
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                      No Avatar
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="text-sm"
                    />

                    <p className="text-xs text-slate-500">
                      {uploading ? "Uploading..." : "Upload profile picture"}
                    </p>
                  </div>
                )}
              </div>

              {/* USER INFO */}

              <div className="mt-20 grid flex-1 grid-cols-1 gap-5 md:grid-cols-2">
                {/* NAME */}

                <div>
                  <label className="text-sm font-medium">Full Name</label>

                  {isEditing ? (
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-2 w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-slate-700">
                      {name || "-"}
                    </p>
                  )}
                </div>

                {/* EMAIL */}

                <div>
                  <label className="text-sm font-medium">Email</label>

                  <p className="mt-2 text-sm text-slate-700">
                    {user?.email || "-"}
                  </p>
                </div>

                {/* DESIGNATION */}

                <div>
                  <label className="text-sm font-medium">Designation</label>

                  {isEditing ? (
                    <input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Frontend Developer"
                      className="mt-2 w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-slate-700">
                      {designation || "-"}
                    </p>
                  )}
                </div>

                {/* TIMEZONE */}

                <div>
                  <label className="text-sm font-medium">Timezone</label>

                  {isEditing ? (
                    <input
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="Asia/Kolkata"
                      className="mt-2 w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-slate-700">
                      {timezone || "-"}
                    </p>
                  )}
                </div>

                {/* BIO */}

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Bio</label>

                  {isEditing ? (
                    <textarea
                      rows={5}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Write something about yourself..."
                      className="mt-2 w-full resize-none rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-slate-700">
                      {bio || "-"}
                    </p>
                  )}
                </div>

                {/* BUTTONS */}

                <div className="flex justify-end gap-3 md:col-span-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);

                          setName(user?.name || "");

                          setBio(user?.bio || "");

                          setDesignation(user?.designation || "");

                          setTimezone(user?.timezone || "");

                          setAvatarUrl(user?.avatarUrl || "");
                        }}
                      >
                        Cancel
                      </Button>

                      <Button
                        disabled={
                          updateMutation.isPending || uploading
                        }
                        onClick={() =>
                          updateMutation.mutate({
                            name,
                            bio,
                            designation,
                            timezone,
                            avatarUrl,
                          })
                        }
                      >
                        {updateMutation.isPending
                          ? "Saving..."
                          : "Save Changes"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Projects</p>

            <h2 className="mt-2 text-3xl font-bold">
              {user?.stats?.totalProjects || 0}
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Tasks</p>

            <h2 className="mt-2 text-3xl font-bold">
              {user?.stats?.totalTasks || 0}
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Completed</p>

            <h2 className="mt-2 text-3xl font-bold">
              {user?.stats?.completedTasks || 0}
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Active Sprints</p>

            <h2 className="mt-2 text-3xl font-bold">
              {user?.stats?.activeSprints || 0}
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Workspaces</p>

            <h2 className="mt-2 text-3xl font-bold">
              {user?.stats?.totalWorkspaces || 0}
            </h2>
          </div>
        </div>
        {/* ACTIVITY SECTION */}

<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
  {/* PROJECTS */}

  <div className="rounded-2xl border bg-white p-6 shadow-sm">
    <h3 className="mb-4 text-lg font-semibold">Projects</h3>

    <div className="space-y-3">
      {user?.projects?.length ? (
        user.projects.map((project: any) => (
          <div
            key={project.id}
            className="rounded-xl border p-3 cursor-pointer"
            onClick={() => router.push(`/workspace/${project.workspace.id}/projects`)}
          >
            <p className="font-medium">{project.name}</p>

            <p className="mt-1 text-xs text-slate-500">
              {project.role}
            </p>

            {project.activeSprint && (
              <p className="mt-2 text-xs text-green-600">
                Active Sprint: {project.activeSprint.name}
              </p>
            )}
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-500">
          No projects found
        </p>
      )}
    </div>
  </div>

  {/* REPORTED TASKS */}

  <div className="rounded-2xl border bg-white p-6 shadow-sm">
    <h3 className="mb-4 text-lg font-semibold">
      Assigned Tasks
    </h3>

    <div className="space-y-3">
      {user?.assignedTasks?.length ? (
        user.assignedTasks.map((task: any) => (
          <div
            key={task.id}
            className="rounded-xl border p-3 cursor-pointer"
            onClick={() => router.push(`/tasks/${task.project?.id}?sprintId=${task.sprint?.id}&taskId=${task.id}`)}
          >
            <p className="font-medium">{task.title}</p>

            <p className="mt-1 text-xs text-slate-500">
              {task.project?.name}
            </p>

            <span className="mt-2 inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
              {task.status}
            </span>
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-500">
          No reported tasks
        </p>
      )}
    </div>
  </div>

  {/* RECENT COMMENTS */}

  <div className="rounded-2xl border bg-white p-6 shadow-sm">
    <h3 className="mb-4 text-lg font-semibold">
      Recent Comments
    </h3>

    <div className="space-y-3">
      {user?.taskComments?.length ? (
        user.taskComments.slice(0, 5).map((comment: any) => (
          <div
            key={comment.id}
            className="rounded-xl border p-3 cursor-pointer"
            onClick={() => router.push(`/tasks/${comment?.task?.project?.id}?sprintId=${comment?.task?.sprint?.id}&taskId=${comment?.task?.id}&commentId=${comment.id}`)}
          >
            <p className="line-clamp-2 text-sm">
              {comment.content}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {comment.task?.taskKey}
            </p>

            <p className="text-xs text-slate-400">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-500">
          No comments yet
        </p>
      )}
    </div>
  </div>
</div>
      </div>
    </div>
  );
}