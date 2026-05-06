const API_URL = process.env.NEXT_PUBLIC_API_URL;

type SignupInput = {
  email: string;
  password: string;
};

type LoginInput = SignupInput;

export type AuthUser = {
  id: string;
  email: string;
  createdAt?: string;
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

export const createWorkspace = async (data: { name: string }) => {
  return request<{
    id: string;
    name: string;
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
  return request<{ workspace: any }>(`/workspace/${id}`);
};

export const updateWorkspace = async ({
  id,
  name,
}: {
  id: string;
  name: string;
}) => {
  return request<{ message: string }>(`/workspace/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
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

export const updateMemberRole = (id: string, data: any) =>
  request(`/workspace/${id}/update-role`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getAllUsers = () => request(`/auth/users`);
