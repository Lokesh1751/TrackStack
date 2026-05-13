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
  return request<{ user: AuthUser }>("/auth/me");
}

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

export const getWorkspaces = async () => {
  return request<{
    workspaces: {
      id: string;
      name: string;
      role: "ADMIN" | "MEMBER";
    }[];
  }>("/workspace", {
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
  request(`/workspace/${id}/members`);

export const addMember = (id: string, data: any) =>
  request(`/workspace/${id}/add-member`, {
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
export const getProjects = async (workspaceId: string) => {
  return request<{ projects: any[] }>(`/workspace/${workspaceId}/projects`);
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
export const getProjectMembers = async (projectId: string) => {
  return request<{ members: any[] }>(`/${projectId}/members`);
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
  userId?: string,
  sprintId?: string,
) => {
  const params = new URLSearchParams();

  if (userId) {
    params.append("userId", userId);
  }

  // ✅ NEW
  if (sprintId) {
    params.append("sprintId", sprintId);
  }

  const query = params.toString();

  return request<{ tasks: any[] }>(
    `/projects/${projectId}/tasks${query ? `?${query}` : ""}`,
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

export const getProjectSprints = async (projectId: string) => {
  return request<{ sprints: any[] }>(`/projects/${projectId}/sprints`);
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

export const getBacklogTasks = async (projectId: string) => {
  return request<{ tasks: any[] }>(`/projects/${projectId}/backlog`);
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
