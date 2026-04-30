const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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
  });
}

export async function forgotPassword(email: string) {
  return request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export const resetPassword = async (data: {
  token: string;
  newPassword: string;
}) => {
  const res = await fetch("http://localhost:3000/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to reset password");
  }

  return res.json();
};