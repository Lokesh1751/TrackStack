"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function InviteMemberModal({
  open,
  onClose,
  users,
  onInvite,
  isLoading,
}: any) {
  const [selectedUser, setSelectedUser] = useState("");
  const [role, setRole] = useState("MEMBER");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-[#7189D0]/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Invite Member</h2>

        {/* User dropdown */}
        <select
          className="w-full border p-2 rounded"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select user</option>
          {users.map((u: any) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </select>

        {/* Role */}
        <select
          className="w-full border p-2 rounded"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="MEMBER">MEMBER</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={() => onInvite(selectedUser, role)}
            disabled={!selectedUser}
          >
            {isLoading ? "Adding..." : "Add Member"}
          </Button>
        </div>
      </div>
    </div>
  );
}
