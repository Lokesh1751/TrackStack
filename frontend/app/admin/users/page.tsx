"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { getAllUsers, updateMemberRole } from "@/lib/api";

import { useToast } from "@/hooks/useToast";

import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const toast = useToast();

  const { data, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  const users = data?.users ?? [];

  const mutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: string;
    }) =>
      updateMemberRole({
        userId,
        role,
      }),

    onSuccess: () => {
      toast.success("Role updated");

      refetch();
    },

    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>

          <p className="text-sm text-slate-500">Manage user roles</p>
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Email</th>

                <th className="text-left p-4 text-sm font-medium">Created</th>

                <th className="text-left p-4 text-sm font-medium">Role</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b">
                  <td className="p-4 text-sm">{user.email}</td>

                  <td className="p-4 text-sm text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2">
                      {user.role === "MEMBER" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            mutation.mutate({
                              userId: user.id,
                              role: "ADMIN",
                            })
                          }
                        >
                          Make Admin
                        </Button>
                      )}

                      {user.role === "ADMIN" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            mutation.mutate({
                              userId: user.id,
                              role: "MEMBER",
                            })
                          }
                        >
                          Make Member
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
