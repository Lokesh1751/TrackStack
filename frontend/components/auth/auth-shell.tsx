"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login, signup, forgotPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const authSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(100, "Password is too long."),
});

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

type AuthFormValues = z.infer<typeof authSchema>;
type ForgotFormValues = z.infer<typeof forgotSchema>;

export function AuthShell() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [view, setView] = useState<"auth" | "forgot">("auth");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resetLink, setResetLink] = useState("");

  // ---------------- AUTH FORM ----------------
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  // ---------------- FORGOT FORM ----------------
  const forgotForm = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  // ---------------- MUTATIONS ----------------
  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      setErrorMessage("");
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error: Error) => setErrorMessage(error.message || "Something went wrong"),
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      setErrorMessage("");
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error: Error) => setErrorMessage(error.message || "Something went wrong"),
  });

  const forgotMutation = useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    onSuccess: (data: { message: string, resetLink: string }) => {
      setSuccessMessage(data?.message);
      setErrorMessage("");
      setResetLink(data?.resetLink);
      console.log('data',data)
      window.open(data?.resetLink, "_blank");
    },
    onError: (error: Error) => setErrorMessage(error.message || "Something went wrong"),
  });

  const isLoading =
    signupMutation.isPending ||
    loginMutation.isPending ||
    forgotMutation.isPending;

  // ---------------- HANDLERS ----------------
  const onSubmit = (values: AuthFormValues) => {
    setErrorMessage("");
    if (activeTab === "signup") {
      signupMutation.mutate(values);
      return;
    }
    loginMutation.mutate(values);
  };

  const onForgotSubmit = (values: ForgotFormValues) => {
    setErrorMessage("");
    setSuccessMessage("");
    forgotMutation.mutate(values?.email);
  };

  // ---------------- UI ----------------
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* LEFT SIDE */}
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1508261305436-b6f84f9727c9?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/60 to-slate-950/80" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <p className="text-3xl font-semibold tracking-tight">TrackStack</p>
          <div className="max-w-sm space-y-2">
            <h2 className="text-3xl font-semibold">
              Track your progress smarter.
            </h2>
            <p className="text-sm text-white/80">
              A focused workspace to organize tasks and stay consistent.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center bg-slate-50 px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {view === "forgot"
                ? "Forgot Password"
                : "Welcome to TrackStack"}
            </CardTitle>
            <CardDescription>
              {view === "forgot"
                ? "Enter your email to receive a reset link"
                : "Sign in or create a new account"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* ================= FORGOT PASSWORD VIEW ================= */}
            {view === "forgot" ? (
              <form
                onSubmit={forgotForm.handleSubmit(onForgotSubmit)}
                className="space-y-4"
              >
                <div>
                  <Label>Email</Label>
                  <Input {...forgotForm.register("email")} />
                </div>

                {successMessage && (
                  <p className="text-sm text-green-600">{successMessage}</p>
                )}

                {errorMessage && (
                  <p className="text-sm text-red-600">{errorMessage}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>

                <button
                  type="button"
                  onClick={() => setView("auth")}
                  className="text-sm text-blue-600"
                >
                  Back to login
                </button>
              </form>
            ) : (
              /* ================= LOGIN / SIGNUP ================= */
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "login" | "signup")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <Label>Email</Label>
                      <Input {...form.register("email")} />
                    </div>

                    <div>
                      <Label>Password</Label>
                      <Input type="password" {...form.register("password")} />
                    </div>

                    {activeTab === "login" && (
                      <div className="text-sm text-right">
                        <button
                          type="button"
                          onClick={() => setView("forgot")}
                          className="text-blue-600 hover:text-blue-500"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    {errorMessage && (
                      <p className="text-sm text-red-600">{errorMessage}</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading
                        ? "Please wait..."
                        : activeTab === "login"
                        ? "Sign in"
                        : "Create account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}