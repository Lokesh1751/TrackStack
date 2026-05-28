const API_URL = process.env.NEXT_PUBLIC_API_URL;

type SignupInput = {
  email: string;
  password: string;
};

type LoginInput = SignupInput;

export type AuthUser = {
  data: {
    id: string;
    email: string;
    createdAt?: string;
  };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const fallback = "Something went wrong.";
    let message = fallback;
    try {
      const data = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(data.message)) {
        message = data.message.join(", ");
      } else if (typeof data.message === "string") {
        message = data.message;
      }
    } catch {
      message = fallback;
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;

  isRead: boolean;

  createdAt: string;
  updatedAt: string;

  userId?: string;

  workspaceId?: string;
  projectId?: string;
  taskId?: string;
  sprintId?: string;

  triggeredById?: string;

  triggeredBy?: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };

  user?: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}
export interface NotificationsResponse {
  notifications: Notification[];

  total: number;

  page: number;

  limit: number;

  totalPages: number;
}
export async function signup(payload: SignupInput) {
  return request<{ user: AuthUser }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginInput) {
  return request<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser() {
  return request<any>("/auth/me");
}

export const updateProfile = async (data: {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  designation?: string;
  timezone?: string;
}) => {
  return request<{
    success: boolean;
    message: string;
    data: {
      id: string;
      email: string;
      name?: string;
      bio?: string;
      avatarUrl?: string;
      designation?: string;
      timezone?: string;
      isSuperAdmin: boolean;
      createdAt: string;
    };
  }>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export async function logout() {
  return request<{ success: boolean }>("/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export async function forgotPassword(email: string) {
  return request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function generateResetOtp(email: string) {
  if (!email) throw new Error("Email is required");

  return request<{ message: string; resetTokenExpiry: string }>(
    "/auth/generate-reset-otp",
    {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    },
  );
}
export async function validateResetOtp(data: { email: string; otp: string }) {
  return request<{ message: string }>("/auth/validate-reset-otp", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export const resetPassword = async (data: {
  email: string;
  otp: string;
  newPassword: string;
}) => {
  return request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const getWorkspaces = async (params?: {
  role?: "ADMIN" | "MEMBER";
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();

  if (params?.role) query.set("role", params.role);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString();

  return request<{
    workspaces: {
      id: string;
      name: string;
      role: "ADMIN" | "MEMBER";
    }[];
  }>(`/workspace${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
  });
};

export const createWorkspace = async (data: {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
}) => {
  return request<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
  }>("/workspace", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const deleteWorkspace = async (workspaceId: string) => {
  return request<{ message: string }>(`/workspace/${workspaceId}`, {
    method: "DELETE",
  });
};

export const getWorkspaceById = async (id: string) => {
  return request<{
    workspace: {
      id: string;
      name: string;
      slug: string;
      description?: string;
      logoUrl?: string;
      isSuperAdmin?: boolean;
      role: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }>(`/workspace/${id}`);
};

export const updateWorkspace = async (
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
  },
) => {
  return request(`/workspace/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const getWorkspaceMembers = (id: string) =>
  request<any>(`/workspace/${id}/members`);

export const addMember = (id: string, data: any) =>
  request<{ message: string }>(`/workspace/${id}/add-member`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const removeMember = (id: string, userId: string) =>
  request(`/workspace/${id}/remove-member/${userId}`, {
    method: "DELETE",
    body: JSON.stringify({ userId }),
  });

export const getAllUsers = async () => {
  return request<{
    users: {
      id: string;
      email: string;
      createdAt: string;
    }[];
  }>("/auth/users");
};

export const updateMemberRole = async (
  workspaceId: string,
  data: {
    userId: string;
    role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
  },
) => {
  return request(`/workspace/${workspaceId}/update-member-role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

// =========================
// CREATE PROJECT
// =========================
export const createProject = async (
  workspaceId: string,
  data: {
    name: string;
    description?: string;
  },
) => {
  return request<{ message: string; project: any }>(
    `/workspace/${workspaceId}/projects`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
};

// =========================
// GET PROJECTS
// =========================
export const getProjects = async (
  workspaceId: string,
  params?: {
    search?: string;
  },
) => {
  const query = new URLSearchParams();

  if (params?.search) {
    query.append("search", params.search);
  }

  const queryString = query.toString();

  return request<{ projects: any[] }>(
    `/workspace/${workspaceId}/projects${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    },
  );
};

// =========================
// GET PROJECT BY ID
// =========================
export const getProjectById = async (projectId: string) => {
  return request<{ project: any }>(`/project/${projectId}`);
};

// =========================
// UPDATE PROJECT
// =========================
export const updateProject = async (
  projectId: string,
  data: {
    name: string;
    description?: string;
  },
) => {
  return request<{ message: string; project: any }>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// =========================
// DELETE PROJECT
// =========================
export const deleteProject = async (projectId: string) => {
  return request<{ message: string }>(`/projects/${projectId}`, {
    method: "DELETE",
  });
};

// =========================
// GET PROJECT MEMBERS
// =========================
export const getProjectMembers = async (
  projectId: string,
  params?: { search?: string },
) => {
  const query = params?.search
    ? `?searchMember=${encodeURIComponent(params.search)}`
    : "";

  return request<{ members: any[] }>(`/${projectId}/members${query}`, {
    method: "GET",
  });
};

// =========================
// ADD PROJECT MEMBER
// =========================
export const addProjectMember = async (
  projectId: string,
  data: {
    email: string;
  },
) => {
  return request<{ message: string }>(`/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// =========================
// REMOVE PROJECT MEMBER
// =========================
export const removeProjectMember = async (
  projectId: string,
  userId: string,
) => {
  return request<{ message: string }>(`/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
};

// =====================================
// CREATE TASK
// =====================================

export const createTask = async (
  projectId: string,
  data: {
    title: string;
    description?: string;
    type: string;
    priority: string;
    status?: string;
    estimateMinutes?: number;
    dueDate?: string;

    // ✅ NEW
    sprintId?: string | null;
    assigneeId?: string | null;
  },
) => {
  return request<{ message: string; task: any }>(
    `/projects/${projectId}/tasks`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
};

// =====================================
// GET PROJECT TASKS
// =====================================

export const getProjectTasks = async (
  projectId: string,
  filterUserId?: string,
  sprintId?: string,
  filters?: {
    search?: string;
    status?: string;
    priority?: string;
    type?: string;
  },
) => {
  const params = new URLSearchParams();

  if (filterUserId) {
    params.set("filterUserId", filterUserId);
  }

  if (sprintId) {
    params.set("sprintId", sprintId);
  }

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.status) {
    params.set("status", filters.status);
  }

  if (filters?.priority) {
    params.set("priority", filters.priority);
  }

  if (filters?.type) {
    params.set("type", filters.type);
  }

  return request<{ tasks: any[] }>(
    `/project/${projectId}/tasks?${params.toString()}`,
  );
};

// =====================================
// GET TASK BY ID
// =====================================

export const getTaskById = async (taskId: string) => {
  return request<{ task: any }>(`/tasks/${taskId}`);
};

// =====================================
// UPDATE TASK
// =====================================

export const updateTask = async (
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    estimateMinutes?: number;
    dueDate?: string;

    // ✅ NEW
    sprintId?: string | null;
    assigneeId?: string | null;
  },
) => {
  return request<{ message: string; task: any }>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// =====================================
// DELETE TASK
// =====================================

export const deleteTask = async (taskId: string) => {
  return request<{ message: string }>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
};

// =====================================
// UPDATE TASK STATUS
// =====================================

export const updateTaskStatus = async (
  taskId: string,
  data: {
    status: string;
  },
) => {
  return request<{ message: string; task: any }>(`/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// =====================================
// ASSIGN TASK
// =====================================

export const assignTask = async (taskId: string, assigneeId: string) => {
  return request<{ message: string; task: any }>(`/tasks/${taskId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ assigneeId }),
  });
};

// =====================================
// ADD COMMENT
// =====================================

export const addTaskComment = async (
  taskId: string,
  data: {
    content: string;
    mentions?: string[];
  },
) => {
  return request<{ message: string; comment: any }>(
    `/tasks/${taskId}/comments`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
};

// =====================================
// GET COMMENTS
// =====================================

export const getTaskComments = async (taskId: string) => {
  return request<{ comments: any[] }>(`/tasks/${taskId}/comments`);
};

// =====================================
// DELETE COMMENT
// =====================================

export const deleteComment = async (commentId: string) => {
  return request<{ message: string }>(`/comments/${commentId}`, {
    method: "DELETE",
  });
};

// =====================================================
// SPRINT APIs
// =====================================================

// =====================================
// CREATE SPRINT
// =====================================

export const createSprint = async (
  projectId: string,
  data: {
    name: string;
    goal?: string;
    startDate?: string;
    endDate?: string;
  },
) => {
  return request<{ message: string; sprint: any }>(
    `/projects/${projectId}/sprints`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
};

// =====================================
// GET PROJECT SPRINTS
// =====================================

export const getProjectSprints = async (
  projectId: string,
  params?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  },
) => {
  const query = new URLSearchParams();

  if (params?.search) {
    query.set("search", params.search);
  }

  if (params?.status) {
    query.set("status", params.status);
  }

  if (params?.startDate) {
    query.set("startDate", params.startDate);
  }

  if (params?.endDate) {
    query.set("endDate", params.endDate);
  }

  return request<{ sprints: any[] }>(
    `/projects/${projectId}/sprints?${query.toString()}`,
  );
};

// =====================================
// GET SPRINT BY ID
// =====================================

export const getSprintById = async (sprintId: string) => {
  return request<{ sprint: any }>(`/sprints/${sprintId}`);
};

// =====================================
// UPDATE SPRINT
// =====================================

export const updateSprint = async (
  sprintId: string,
  data: {
    name?: string;
    goal?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  },
) => {
  return request<{ message: string; sprint: any }>(`/sprints/${sprintId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// =====================================
// DELETE SPRINT
// =====================================

export const deleteSprint = async (sprintId: string) => {
  return request<{ message: string }>(`/sprints/${sprintId}`, {
    method: "DELETE",
  });
};

// =====================================
// START SPRINT
// =====================================

export const startSprint = async (sprintId: string) => {
  return request<{ message: string; sprint: any }>(
    `/sprints/${sprintId}/start`,
    {
      method: "PATCH",
    },
  );
};

// =====================================
// COMPLETE SPRINT
// =====================================

export const completeSprint = async (sprintId: string) => {
  return request<{ message: string; sprint: any }>(
    `/sprints/${sprintId}/complete`,
    {
      method: "PATCH",
    },
  );
};

// =====================================
// ADD TASK TO SPRINT
// =====================================

export const addTaskToSprint = async (sprintId: string, taskId: string) => {
  return request<{ message: string; task: any }>(
    `/sprints/${sprintId}/tasks/${taskId}`,
    {
      method: "PATCH",
    },
  );
};

// =====================================
// REMOVE TASK FROM SPRINT
// =====================================

export const removeTaskFromSprint = async (taskId: string) => {
  return request<{ message: string; task: any }>(
    `/tasks/${taskId}/remove-sprint`,
    {
      method: "PATCH",
    },
  );
};

// =====================================
// GET BACKLOG TASKS
// Tasks with sprintId = null
// =====================================

export const getBacklogTasks = async (
  projectId: string,
  params?: {
    search?: string;
    status?: string;
    priority?: string;
    type?: string;
    filterUserId?: string;
  },
) => {
  const searchParams = new URLSearchParams();

  if (params?.search) {
    searchParams.set("search", params.search);
  }

  if (params?.status) {
    searchParams.set("status", params.status);
  }

  if (params?.priority) {
    searchParams.set("priority", params.priority);
  }

  if (params?.type) {
    searchParams.set("type", params.type);
  }

  if (params?.filterUserId) {
    searchParams.set("filterUserId", params.filterUserId);
  }

  return request<{ tasks: any[] }>(
    `/projects/${projectId}/backlog?${searchParams.toString()}`,
  );
};

// =====================================
// LINK TASK
// =====================================

export const createTaskLink = async (
  taskId: string,
  data: {
    targetTaskId: string;
    type: "BLOCKS" | "RELATES_TO" | "DUPLICATES" | "DEPENDS_ON" | "CAUSED_BY";
  },
) => {
  return request<{
    message: string;
    link: any;
  }>(`/tasks/${taskId}/links`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// =====================================
// GET TASK LINKS
// =====================================

export const getTaskLinks = async (taskId: string) => {
  return request<{
    linkedTasks: any[];
    linkedFromTasks: any[];
  }>(`/tasks/${taskId}/links`);
};

// =====================================
// UPDATE TASK LINK
// =====================================

export const updateTaskLink = async (
  linkId: string,
  type: "BLOCKS" | "RELATES_TO" | "DUPLICATES" | "DEPENDS_ON" | "CAUSED_BY",
) => {
  return request<{
    message: string;
    link: any;
  }>(`/task-links/${linkId}`, {
    method: "PATCH",
    body: JSON.stringify({
      type,
    }),
  });
};

// =====================================
// DELETE TASK LINK
// =====================================

export const deleteTaskLink = async (linkId: string) => {
  return request<{
    message: string;
  }>(`/task-links/${linkId}`, {
    method: "DELETE",
  });
};

export const getSprintDashboard = async (sprintId: string) => {
  return request<{
    sprint: {
      id: string;
      name: string;
      status: string;
      startDate: string;
      endDate: string;
      projectId: string;
    };

    stats: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;

      totalEstimate: number;
      completedEstimate: number;
      remainingEstimate: number;

      sprintProgress: number;

      totalDays: number;
      daysLeft: number;
      daysPassed: number;

      health: string;
    };

    statusDistribution: {
      status: string;
      count: number;
    }[];

    velocityData: {
      email: string;
      estimate: number;
    }[];

    burndownData: {
      date: string;
      remainingEstimate: number;
    }[];
  }>(`/sprints/${sprintId}/dashboard`);
};

// =========================
// ACCEPT PROJECT INVITE
// =========================

export const acceptProjectInvite = async (token: string) => {
  return request<{
    message: string;
  }>(`/accept-invite?token=${token}`, {
    method: "POST",
  });
};

// =========================
// DECLINE PROJECT INVITE
// =========================

export const declineProjectInvite = async (token: string) => {
  return request<{
    message: string;
  }>(`/decline-invite?token=${token}`, {
    method: "POST",
  });
};

export const acceptWorkspaceInvite = async (token: string) => {
  return request<{
    message: string;
  }>(`/workspace/accept-workspace-invite?token=${token}`, {
    method: "POST",
  });
};

export const declineWorkspaceInvite = async (token: string) => {
  return request<{
    message: string;
  }>(`/workspace/decline-workspace-invite?token=${token}`, {
    method: "POST",
  });
};

export const getNotifications = async (page = 1, limit = 20) => {
  return request<NotificationsResponse>(
    `/notifications?page=${page}&limit=${limit}`,
    {
      method: "GET",
    },
  );
};

// =====================================================
// GET UNREAD COUNT
// =====================================================

export const getUnreadNotificationsCount = async () => {
  return request<{
    count: number;
  }>("/notifications/unread-count", {
    method: "GET",
  });
};

// =====================================================
// MARK SINGLE NOTIFICATION AS READ
// =====================================================

export const markNotificationAsRead = async (notificationId: string) => {
  return request<{
    message: string;
  }>(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
};

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

export const markAllNotificationsAsRead = async () => {
  return request<{
    message: string;
  }>("/notifications/read-all", {
    method: "PATCH",
  });
};

// =====================================================
// DELETE NOTIFICATION
// =====================================================

export const deleteNotification = async (notificationId: string) => {
  return request<{
    message: string;
  }>(`/notifications/${notificationId}`, {
    method: "DELETE",
  });
};
