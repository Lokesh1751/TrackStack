"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  getWorkspaces,
  deleteWorkspace,
  createWorkspace,
  logout,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/columns/data-table";
import { getColumns } from "@/components/columns/workspace-columns";
import { useToast } from "@/hooks/useToast";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
    staleTime: 0,
    refetchOnMount: true,
  });

  const workspaces = data?.workspaces ?? [];

  const deleteMutation = useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace deleted successfully", {
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast.error("", {
        description: error.message,
      });
    },
  });

  // ➕ create
  const createMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: (data: any) => {
      setOpen(false);
      setName("");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace created successfully", {
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast.error("", {
        description: error.message,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      router.push("/");
      toast.success("Logged out successfully");
    },
    onError: (error: Error) => {
      toast.error("", {
        description: error.message,
      });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Workspaces</h1>
            <p className="text-sm text-slate-500">Manage your workspaces</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setOpen(true)}>+ New Workspace</Button>

            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>

        {!data && isLoading ? (
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            Loading workspaces...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="border rounded-lg bg-white p-10 text-center">
            <p className="text-slate-500">No workspaces yet</p>

            <Button className="mt-4" onClick={() => setOpen(true)}>
              Create your first workspace
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            <DataTable
              data={workspaces}
              columns={getColumns(
                (id) => router.push(`/workspace/${id}/edit`),
                (id) => deleteMutation.mutate(id),
                deleteMutation.isPending,
              )}
              onRowClick={(row: { id: string; role: string }) => {
                if (row.role === "ADMIN") {
                  router.push(`/workspace/${row.id}`);
                } else {
                  router.push(`/workspace/${row.id}/issues`);
                }
              }}
            />
          </div>
        )}

      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Create Workspace</h2>

            <input
              className="w-full border p-2 rounded"
              placeholder="Workspace name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
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