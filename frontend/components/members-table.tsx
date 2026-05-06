"use client";

import { Button } from "@/components/ui/button";

export function MembersTable({
  members,
  isAdmin,
  onRemove,
  onRoleChange,
}: any) {
  return (
    <div className="border rounded-lg bg-white">
      <table className="w-full text-sm">
        <thead className="border-b bg-slate-50">
          <tr>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Role</th>
            {isAdmin && <th className="p-3 text-right">Actions</th>}
          </tr>
        </thead>

        <tbody>
          {members.map((m: any) => (
            <tr key={m.id} className="border-b">
              <td className="p-3">{m.email}</td>

              <td className="p-3">
                {isAdmin ? (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      onRoleChange(m.userId, e.target.value)
                    }
                    className="border rounded px-2 py-1"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MEMBER">MEMBER</option>
                  </select>
                ) : (
                  m.role
                )}
              </td>

              {isAdmin && (
                <td className="p-3 text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onRemove(m.userId)}
                  >
                    Remove
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}