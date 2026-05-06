"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

export type Workspace = {
  id: string;
  name: string;
  ownerId: string;
  role: "ADMIN" | "MEMBER";
};

export const getColumns = (
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  deleteLoading: boolean,
): ColumnDef<Workspace>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "id",
    header: "Workspace ID",
    cell: ({ row }) => (
      <span className="text-xs text-slate-500">{row.original.id}</span>
    ),
  },
  {
    accessorKey: "ownerId",
    header: "Owner ID",
    cell: ({ row }) => (
      <span className="text-xs text-slate-500">{row.original.ownerId}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <span
        className={`text-xs px-2 py-1 rounded ${
          row.original.role === "ADMIN"
            ? "bg-green-100 text-green-700"
            : "bg-blue-100 text-blue-700"
        }`}
      >
        {row.original.role}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) =>
      row.original.role === "ADMIN" ? (
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row.original.id);
            }}
          >
            Edit
          </Button>

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row.original.id);
            }}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      ) : null,
  },
];
