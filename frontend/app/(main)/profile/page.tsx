"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getCurrentUser, updateProfile } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/image-fallback";
import { ProfilePageSkeleton } from "@/components/skeleton/profile";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const router = useRouter();

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

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile"],
      });
      setIsEditing(false)
    },
  });

  // =========================
  // IMAGE UPLOAD
  // =========================

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("upload_preset", "YOUR_UPLOAD_PRESET");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      setAvatarUrl(data.secure_url);
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* ========================= */}
        {/* PROFILE HEADER */}
        {/* ========================= */}

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-slate-900 to-slate-700" />

          <div className="px-8 pb-8">
            <div className="-mt-16 flex flex-col lg:flex-row gap-8">
              {/* AVATAR */}

              <div className="space-y-4">
                <div className="h-32 w-32 rounded-3xl border-4 border-white overflow-hidden bg-slate-100 shadow-lg">
                  {avatarUrl ? (
                    <ImageWithFallback
                      src={avatarUrl}
                      alt="avatar"
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                      No Avatar
                    </div>
                  )}
                </div>

                {isEditing && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="text-sm"
                  />
                )}
              </div>

              {/* USER INFO */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 mt-20">
                {/* NAME */}
                <div>
                  <label className="text-sm font-medium">Full Name</label>

                  {isEditing ? (
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-2 w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-slate-700">{name || "-"}</p>
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
                      className="mt-2 w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
                      className="mt-2 w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
                      className="mt-2 w-full border rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-black/10"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-slate-700">{bio || "-"}</p>
                  )}
                </div>

                {/* BUTTONS */}
                <div className="md:col-span-2 flex justify-end gap-3">
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
                        disabled={updateMutation.isPending}
                        onClick={() =>
                          updateMutation.mutate(
                            {
                              name,
                              bio,
                              designation,
                              timezone,
                              avatarUrl,
                            },
                            {
                              onSuccess: () => {
                                setIsEditing(false);
                              },
                            },
                          )
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

        {/* ========================= */}
        {/* STATS */}
        {/* ========================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <p className="text-sm text-slate-500">Projects</p>

            <h2 className="text-3xl font-bold mt-2">
              {user?.stats?.totalProjects || 0}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <p className="text-sm text-slate-500">Tasks</p>

            <h2 className="text-3xl font-bold mt-2">
              {user?.stats?.totalTasks || 0}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <p className="text-sm text-slate-500">Completed</p>

            <h2 className="text-3xl font-bold mt-2">
              {user?.stats?.completedTasks || 0}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <p className="text-sm text-slate-500">Active Sprints</p>

            <h2 className="text-3xl font-bold mt-2">
              {user?.stats?.activeSprints || 0}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <p className="text-sm text-slate-500">Workspaces</p>

            <h2 className="text-3xl font-bold mt-2">
              {user?.stats?.totalWorkspaces || 0}
            </h2>
          </div>
        </div>

        {/* ========================= */}
        {/* TASKS + PROJECTS */}
        {/* ========================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TASKS */}

          <div className="bg-white rounded-3xl border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-5">Recent Tasks</h2>

            <div className="space-y-4">
              {user?.assignedTasks?.length ? (
                user.assignedTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="border rounded-2xl p-4 flex items-center justify-between cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/tasks/${task?.project?.id}?sprint=${task?.sprint?.id}&taskId=${task?.id}`,
                      )
                    }
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>

                      <p className="text-sm text-slate-500 mt-1">
                        {task.project?.name}
                      </p>
                    </div>

                    <span className="text-xs px-3 py-1 rounded-full bg-slate-100">
                      {task.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No tasks assigned</p>
              )}
            </div>
          </div>

          {/* PROJECTS */}

          <div className="bg-white rounded-3xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Projects</h2>

                <p className="text-sm text-slate-500 mt-1">
                  Projects you are part of
                </p>
              </div>

              <div className="text-sm text-slate-500">
                {user?.stats?.totalProjects || 0} Projects
              </div>
            </div>

            <div className="space-y-4">
              {user?.projects?.length ? (
                user.projects.map((project: any) => (
                  <div
                    key={project.id}
                    className="border rounded-2xl p-5 hover:border-slate-300 transition-all cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/tasks/${project?.id}?sprint=${project?.activeSprint?.id}`,
                      )
                    }
                  >
                    {/* HEADER */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {project.name}
                          </h3>

                          <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                            {project.role}
                          </span>

                          {project.activeSprint && (
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                              Active Sprint
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-500">
                          {project.description || "No description added"}
                        </p>
                      </div>
                    </div>

                    {/* WORKSPACE */}
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                      <span className="font-medium text-slate-700">
                        Workspace:
                      </span>

                      <span>{project.workspace?.name}</span>
                    </div>

                    {/* ACTIVE SPRINT */}
                    {project.activeSprint && (
                      <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <p className="text-sm text-slate-500">
                              Current Active Sprint
                            </p>

                            <h4 className="font-semibold text-slate-900 mt-1">
                              {project.activeSprint.name}
                            </h4>
                          </div>

                          <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                            {project.activeSprint.status}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-6 text-sm text-slate-600 flex-wrap">
                          <div>
                            <span className="font-medium">Start:</span>{" "}
                            {new Date(
                              project.activeSprint.startDate,
                            ).toLocaleDateString()}
                          </div>

                          <div>
                            <span className="font-medium">End:</span>{" "}
                            {new Date(
                              project.activeSprint.endDate,
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="border rounded-2xl p-10 text-center">
                  <p className="text-sm text-slate-500">No projects found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
