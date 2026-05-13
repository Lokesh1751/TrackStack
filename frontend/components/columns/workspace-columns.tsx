"use client";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "../image-fallback";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  ownerId: string;
  role: "ADMIN" | "MEMBER" | "SUPER_ADMIN";
};

export const getColumns = (
  onEdit: (id: string | undefined) => void,
  onDelete: (id: string) => void,
  deleteLoading: boolean,
  onInvite: (id: string) => void,
  isSuperAdmin: boolean,
  redirectUrl: (workspaceId: string) => void,
): ColumnDef<Workspace>[] => [
  // ✅ Logo + Name
  {
    accessorKey: "name",
    header: "Workspace",

    cell: ({ row }) => (
      <div className="flex items-center gap-3 min-w-[220px]">
        {/* Logo */}
        <div className="h-10 w-10 rounded-xl overflow-hidden border bg-slate-100 flex items-center justify-center shrink-0">
          {row.original.logoUrl ? (
            <ImageWithFallback
              src={row.original.logoUrl}
              alt={row.original.name}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[10px] text-slate-400">N/A</span>
          )}
        </div>

        {/* Name */}
        <div className="min-w-0">
          <p className="font-medium truncate">{row.original.name}</p>

          <p className="text-xs text-slate-500 truncate">
            /{row.original.slug}
          </p>
        </div>
      </div>
    ),
  },

  // ✅ Description
  {
    accessorKey: "description",
    header: "Description",

    cell: ({ row }) => (
      <div className="max-w-[320px]">
        <p className="text-sm text-slate-600 line-clamp-2">
          {row.original.description || "—"}
        </p>
      </div>
    ),
  },

  // ✅ Role
  {
    accessorKey: "role",
    header: "Role",

    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
          row.original.role === "ADMIN"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-blue-100 text-blue-700"
        }`}
      >
        {row.original.role}
      </span>
    ),
  },

  // ✅ Owner
  {
    accessorKey: "ownerId",
    header: "Owner",

    cell: ({ row }) => (
      <span className="text-xs text-slate-500">
        {row.original.ownerId.slice(0, 8)}...
      </span>
    ),
  },

  // ✅ Actions
  {
    id: "actions",
    header: "Actions",

    cell: ({ row }) => (
      <div
        className="flex flex-row gap-2 w-[50%]"
        onClick={(e) => e.stopPropagation()}
      >
        {(row.original.role === "ADMIN" ||
          row.original.role === "SUPER_ADMIN") && (
          <div
            className="flex items-center  gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => onInvite(row.original.id)}
            >
              +
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(row.original.id)}
            >
              Edit
            </Button>

            <Button size="sm" onClick={() => onDelete(row.original.id)}>
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => redirectUrl(row.original.id)}
        >
          Projects
        </Button>
      </div>
    ),
  },
];
