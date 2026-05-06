"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import {
  getWorkspaces,
  deleteWorkspace,
  createWorkspace,
  logout,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/columns/data-table";
import { getColumns } from "@/components/columns/workspace-columns";
import { useQueryClient } from "@tanstack/react-query";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
  });

  const workspaces = data?.workspaces ?? [];

  const deleteMutation = useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      setOpen(false);
      setName("");
  
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => router.push("/"),
  });

  // 🔁 redirect MEMBER
  useEffect(() => {
    if (!data) return;

    const admin = workspaces.find((w) => w.role === "ADMIN");

    if (!admin && workspaces.length > 0) {
      router.push(`/workspace/${workspaces[0].id}/issues`);
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Container */}
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Workspaces
            </h1>
            <p className="text-sm text-slate-500">
              Manage your workspaces
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setOpen(true)}>
              + New Workspace
            </Button>

            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            Loading workspaces...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="border rounded-lg bg-white p-10 text-center">
            <p className="text-slate-500">
              No workspaces yet
            </p>

            <Button
              className="mt-4"
              onClick={() => setOpen(true)}
            >
              Create your first workspace
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-2">
            <DataTable
              data={workspaces}
              columns={getColumns(
                (id) => router.push(`/workspace/${id}/edit`),
                (id) => deleteMutation.mutate(id),
                deleteMutation.isPending,
              )}
              onRowClick={(row: any) =>
                router.push(`/workspace/${row.id}`)
              }
            />
          </div>
        )}

        {/* subtle refresh indicator */}
        {isFetching && !isLoading && (
          <p className="text-xs text-slate-400">
            Refreshing...
          </p>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-xl p-6 space-y-4 shadow-lg">

            <h2 className="text-lg font-semibold">
              Create Workspace
            </h2>

            <input
              className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Workspace name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={() => createMutation.mutate({ name })}
                disabled={!name || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}