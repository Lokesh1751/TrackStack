"use client";

import Link from "next/link";
import Header from "@/components/layout/header";

import {
  ArrowRight,
  LayoutDashboard,
  Users,
  KanbanSquare,
  BarChart3,
  ShieldCheck,
  Clock3,
  FolderKanban,
  BriefcaseBusiness,
  ListTodo,
  Activity,
  UserCog,
  Sparkles,
  Rocket,
  Target,
  CheckSquare,
} from "lucide-react";

export default function LandingPage() {
  const isLoggedIn =
    typeof window !== "undefined" ? localStorage?.getItem("userId") : null;

  const features = [
    {
      icon: BriefcaseBusiness,
      title: "Workspace Management",
      desc: "Super Admins and Workspace Admins can create and manage collaborative workspaces for different teams and organizations.",
    },
    {
      icon: Users,
      title: "Team Invitations",
      desc: "Invite members directly into workspaces and projects with controlled role-based access permissions.",
    },
    {
      icon: ShieldCheck,
      title: "Role Based Permissions",
      desc: "Secure workspace access using Super Admin, Workspace Admin and Member level permission controls.",
    },
    {
      icon: FolderKanban,
      title: "Project Management",
      desc: "Workspace Admins can create and organize multiple projects with dedicated agile workflows.",
    },
    {
      icon: KanbanSquare,
      title: "Task Boards",
      desc: "Manage project tasks visually using modern kanban-style boards with organized workflow stages.",
    },
    {
      icon: ListTodo,
      title: "Task Collaboration",
      desc: "Collaborate efficiently through task comments, discussions and doubt resolution directly inside tasks.",
    },
    {
      icon: Clock3,
      title: "Sprint Planning",
      desc: "Create and manage sprint cycles with sprint goals, timelines and assigned project tasks.",
    },
    {
      icon: Rocket,
      title: "Sprint Lifecycle",
      desc: "Start, monitor and complete agile sprints with structured workflow management.",
    },
    {
      icon: Activity,
      title: "Sprint Analytics",
      desc: "Track sprint performance with analytics dashboards, charts and productivity insights.",
    },
    {
      icon: LayoutDashboard,
      title: "Modern Dashboards",
      desc: "Beautiful dashboards providing workspace summaries, sprint status and project visibility.",
    },
    {
      icon: UserCog,
      title: "Project Member Access",
      desc: "Add and manage project members through invitation-based collaboration workflows.",
    },
    {
      icon: BarChart3,
      title: "Agile Productivity Tracking",
      desc: "Monitor team productivity, sprint execution and task completion progress in real time.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <Header />

      {/* ================================================= */}
      {/* HERO */}
      {/* ================================================= */}

      <section className="relative overflow-hidden">
        {/* BACKGROUND */}
        <div className="absolute left-1/2 top-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#7189D0]/20 blur-[140px]" />

        <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-[#8ea2df]/20 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 md:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dbe2f1] bg-white px-4 py-2 text-sm text-neutral-600 shadow-sm">
              <Sparkles className="h-4 w-4 text-[#7189D0]" />
              Complete Agile Project Management Platform
            </div>

            <h1 className="text-5xl font-black tracking-tight text-black md:text-7xl leading-tight">
              Build Faster With
              <span className="bg-gradient-to-r from-[#7189D0] to-[#4f46e5] bg-clip-text text-transparent">
                {" "}
                Smarter Team
              </span>
              <br />
              Collaboration
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-neutral-500">
              TrackStack helps teams manage projects, tasks, sprints, workspaces
              and agile workflows with a modern collaborative experience
              designed for productivity and scale.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isLoggedIn ? (
                <Link
                  href="/workspaces"
                  className="flex items-center gap-2 rounded-2xl bg-[#7189D0] px-7 py-4 font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:bg-[#5d76c6]"
                >
                  Open Workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center gap-2 rounded-2xl bg-[#7189D0] px-7 py-4 font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:bg-[#5d76c6]"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* DASHBOARD PREVIEW */}
          <div className="relative mx-auto mt-24 max-w-6xl">
            <div className="absolute inset-0 rounded-[40px] bg-[#7189D0]/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[40px] border border-[#e5e9f3] bg-white shadow-2xl">
              {/* TOPBAR */}
              <div className="flex items-center gap-2 border-b border-[#edf1f7] px-6 py-4">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>

              <div className="grid gap-6 p-8 lg:grid-cols-3">
                {/* CARD 1 */}
                <div className="rounded-3xl border border-[#edf1f7] bg-[#fafbff] p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-semibold text-black">
                      Sprint Progress
                    </h3>

                    <div className="rounded-xl bg-[#7189D0]/10 px-3 py-1 text-xs font-medium text-[#7189D0]">
                      Active
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="h-3 rounded-full bg-[#e6ebf5]">
                      <div className="h-3 w-[78%] rounded-full bg-[#7189D0]" />
                    </div>

                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Completed</span>
                      <span>78%</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2 */}
                <div className="rounded-3xl border border-[#edf1f7] bg-[#fafbff] p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <Users className="h-5 w-5 text-[#7189D0]" />

                    <h3 className="font-semibold text-black">Team Members</h3>
                  </div>

                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div
                        key={item}
                        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-[#7189D0] text-sm font-semibold text-white shadow"
                      >
                        U
                      </div>
                    ))}
                  </div>
                </div>

                {/* CARD 3 */}
                <div className="rounded-3xl border border-[#edf1f7] bg-[#fafbff] p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-[#7189D0]" />

                    <h3 className="font-semibold text-black">Analytics</h3>
                  </div>

                  <div className="flex h-24 items-end gap-2">
                    {[40, 70, 50, 90, 65, 85].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-xl bg-[#7189D0]"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* FEATURES */}
      {/* ================================================= */}

      <section className="py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#7189D0]">
              Platform Features
            </p>

            <h2 className="text-4xl font-black tracking-tight text-black md:text-5xl">
              Everything Built For Agile Teams
            </h2>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-neutral-500">
              From workspaces and sprint planning to task boards and analytics,
              TrackStack provides all the tools required for modern project
              delivery and team collaboration.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-[32px] border border-[#e5e9f3] bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#7189D0]/10 transition group-hover:bg-[#7189D0]">
                  <feature.icon className="h-7 w-7 text-[#7189D0] transition group-hover:text-white" />
                </div>

                <h3 className="text-2xl font-bold tracking-tight text-black">
                  {feature.title}
                </h3>

                <p className="mt-4 text-sm leading-8 text-neutral-500">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* WORKFLOW */}
      {/* ================================================= */}

      <section className="pb-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="overflow-hidden rounded-[40px] border border-[#e5e9f3] bg-white shadow-xl">
            <div className="grid gap-10 p-10 lg:grid-cols-2 lg:p-16">
              {/* LEFT */}
              <div>
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#7189D0]">
                  Agile Workflow
                </p>

                <h2 className="text-4xl font-black tracking-tight text-black">
                  Built Around Real Team Productivity
                </h2>

                <p className="mt-6 text-base leading-8 text-neutral-500">
                  Organize projects with structured workflows, sprint cycles,
                  collaborative boards and role based team management — all
                  designed to improve engineering productivity.
                </p>

                <div className="mt-10 space-y-5">
                  {[
                    "Create workspaces and invite teams",
                    "Manage projects and sprint cycles",
                    "Track tasks with agile boards",
                    "Monitor sprint progress and analytics",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#7189D0]/10">
                        <CheckSquare className="h-4 w-4 text-[#7189D0]" />
                      </div>

                      <p className="text-sm leading-7 text-neutral-600">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT */}
              <div className="grid gap-5">
                {[
                  {
                    title: "Workspace Setup",
                    icon: BriefcaseBusiness,
                  },
                  {
                    title: "Project & Sprint Planning",
                    icon: Target,
                  },
                  {
                    title: "Task Execution",
                    icon: KanbanSquare,
                  },
                  {
                    title: "Team Collaboration",
                    icon: Users,
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-5 rounded-3xl border border-[#edf1f7] bg-[#fafbff] p-6"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7189D0] text-white shadow">
                      <step.icon className="h-6 w-6" />
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7189D0]">
                        Step {i + 1}
                      </div>

                      <h3 className="mt-1 text-lg font-bold text-black">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <footer className="border-t border-[#e5e9f3] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 text-center md:flex-row md:px-6 md:text-left">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-black">
              TrackStack
            </h3>

            <p className="mt-2 text-sm text-neutral-500">
              Modern Agile Project & Workspace Management Platform
            </p>
          </div>

          <div className="text-sm text-neutral-500">
            © 2026 TrackStack. Built for collaborative engineering teams.
          </div>
        </div>
      </footer>
    </div>
  );
}
