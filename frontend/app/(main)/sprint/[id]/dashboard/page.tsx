"use client";

import { useParams } from "next/navigation";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  Activity,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Target,
} from "lucide-react";

import { getSprintDashboard } from "@/lib/api";
import { SprintDashboardSkeleton } from "@/components/skeleton/sprint-dashboard";
import { Button } from "@/components/ui/button";

const COLORS = ["#111827", "#7189D0", "#16a34a", "#dc2626"];

export default function SprintDashboardPage() {
  const { id } = useParams();

  const sprintId = id as string;
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["sprint-dashboard", sprintId],

    queryFn: () => getSprintDashboard(sprintId),

    enabled: !!sprintId,
  });

  if (isLoading) {
    return <SprintDashboardSkeleton />;
  }

  const stats = data?.stats;

  const burndownData = data?.burndownData || [];

  const statusDistribution = data?.statusDistribution || [];

  const velocityData = data?.velocityData || [];

  const sprint = data?.sprint;

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      {/* HEADER */}
      <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {sprint?.name}
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Sprint Analytics Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                router.push(`/tasks/${sprint?.projectId}?sprintId=${sprintId}`)
              }
              className="rounded-2xl border px-5 py-5 text-sm cursor-pointer"
            >
              Open Board
            </Button>
            <div
              className={`rounded-2xl px-5 py-3 text-sm font-bold ${
                stats?.health === "HEALTHY"
                  ? "bg-green-100 text-green-700"
                  : stats?.health === "AT_RISK"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {stats?.health}
            </div>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total Tasks"
          value={stats?.totalTasks}
          icon={<Target className="h-5 w-5" />}
        />

        <Card
          title="Completed"
          value={stats?.completedTasks}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <Card
          title="Remaining Estimate"
          value={`${(stats?.remainingEstimate ? stats?.remainingEstimate : 0 / 60).toFixed(1)}h`}
          icon={<Clock3 className="h-5 w-5" />}
        />

        <Card
          title="Sprint Progress"
          value={`${stats?.sprintProgress}%`}
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      {/* CHARTS */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* BURNDOWN */}
        <div className="xl:col-span-2 rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Burndown Chart</h2>

            <p className="text-sm text-neutral-500">
              Remaining sprint estimate trend
            </p>
          </div>

          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  }
                />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="remainingEstimate"
                  stroke="#111827"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Task Status</h2>

            <p className="text-sm text-neutral-500">Distribution overview</p>
          </div>

          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  outerRadius={110}
                  label
                >
                  {statusDistribution.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* VELOCITY */}
        <div className="xl:col-span-2 rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Team Velocity</h2>

            <p className="text-sm text-neutral-500">
              Completed estimates by users
            </p>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="email" />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="estimate"
                  fill="#111827"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Sprint Summary</h2>

            <p className="text-sm text-neutral-500">Timeline insights</p>
          </div>

          <div className="space-y-4">
            <SummaryCard label="Days Left" value={stats?.daysLeft} />

            <SummaryCard label="Days Passed" value={stats?.daysPassed} />

            <SummaryCard
              label="Total Estimate"
              value={`${(stats?.totalEstimate ? stats?.totalEstimate : 0 / 60).toFixed(1)}h`}
            />

            <SummaryCard
              label="Completed Estimate"
              value={`${(stats?.completedEstimate ? stats?.completedEstimate : 0 / 60).toFixed(1)}h`}
            />

            <div
              className={`mt-6 rounded-2xl p-4 ${
                stats?.health === "HEALTHY"
                  ? "bg-green-50 text-green-700"
                  : stats?.health === "AT_RISK"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-red-50 text-red-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />

                <span className="font-semibold">{stats?.health}</span>
              </div>

              <p className="mt-2 text-sm">
                Sprint progress evaluation based on estimate completion vs time
                elapsed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   CARD
====================================================== */

function Card({ title, value, icon }: any) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>

          <h2 className="mt-2 text-3xl font-bold">{value}</h2>
        </div>

        <div className="rounded-2xl bg-neutral-100 p-3">{icon}</div>
      </div>
    </div>
  );
}

/* ======================================================
   SUMMARY CARD
====================================================== */

function SummaryCard({ label, value }: any) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4">
      <span className="text-sm text-neutral-500">{label}</span>

      <span className="font-bold">{value}</span>
    </div>
  );
}
