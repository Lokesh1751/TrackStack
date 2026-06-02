"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login, signup, forgotPassword, generateResetOtp } from "@/lib/api";
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
import { useToast } from "@/hooks/useToast";

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters.")
  .max(100, "Password is too long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const signupSchema = z
  .object({
    email: z.string().email("Enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;
type ForgotFormValues = z.infer<typeof forgotSchema>;

export function AuthShell() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [view, setView] = useState<"auth" | "forgot">("auth");
  const [successMessage, setSuccessMessage] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] =
    useState(false);
  const toast = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
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
      router.refresh();
      setActiveTab("login");
      signupForm.reset();
    },
    onError: (error: Error) => {
      toast.error("Something went wrong", {
        description: error?.message,
        duration: 10000,
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data: any) => {
      localStorage.setItem("isSuperAdmin", data.data.isSuperAdmin);
      localStorage.setItem("userId", data.data.id);
      router.push("/");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error("Login failed", {
        description: error.message || "Something went wrong",
      });
    },
  });

  const forgotMutation = useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    onSuccess: (_data: { message: string }, email: string) => {
      generateOtpMutation.mutate(email);
    },
    onError: (error: Error) => {
      toast.error("Failed to send OTP", {
        description: error.message || "Something went wrong",
      });
    },
  });

  const generateOtpMutation = useMutation({
    mutationFn: (email: string) => generateResetOtp(email),
    onSuccess: (data: { message: string; resetTokenExpiry: string }, email: string) => {
      toast.success(data.message);
  
      sessionStorage.setItem(
        "otp_expiry",
        data.resetTokenExpiry
      );
  
      sessionStorage.setItem("otp_email", email);
  
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    },
    onError: (error: Error) => {
      toast.error("Failed to generate OTP", {
        description: error.message || "Something went wrong",
      });
    },
  });

  const isLoading =
    signupMutation.isPending ||
    loginMutation.isPending ||
    forgotMutation.isPending ||
    generateOtpMutation.isPending;

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const onSignupSubmit = (values: SignupFormValues) => {
    signupMutation.mutate({ email: values.email, password: values.password });
  };

  const onForgotSubmit = (values: ForgotFormValues) => {
    setSuccessMessage("");
    forgotMutation.mutate(values?.email);
  };

  // ---------------- UI ----------------
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* LEFT SIDE */}
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1508261305436-b6f84f9727c9?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-linear-to-br from-blue-900/70 via-blue-800/60 to-slate-950/80" />
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
              {view === "forgot" ? "Forgot Password" : "Welcome to TrackStack"}
            </CardTitle>
            <CardDescription>
              {view === "forgot"
                ? "Enter your email to receive an OTP"
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
                  <Input
                    placeholder="you@example.com"
                    {...forgotForm.register("email")}
                  />
                  {forgotForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {forgotForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send OTP"}
                </Button>

                {successMessage && (
                  <p className="text-sm text-green-700">{successMessage}</p>
                )}

                <Button
                  type="button"
                  onClick={() => setView("auth")}
                  variant="outline"
                  className="text-sm cursor-pointer"
                >
                  Back to login
                </Button>
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

                <TabsContent value="login">
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="mt-1 text-xs text-red-600">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showLoginPassword ? "text" : "password"}
                          className="pr-10"
                          placeholder="Enter your password"
                          {...loginForm.register("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                          aria-label={
                            showLoginPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="mt-1 text-xs text-red-600">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="text-sm text-right">
                      <button
                        type="button"
                        onClick={() => setView("forgot")}
                        className="text-black cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading
                        ? "Please wait..."
                        : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form
                    onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...signupForm.register("email")}
                      />
                      {signupForm.formState.errors.email && (
                        <p className="mt-1 text-xs text-red-600">
                          {signupForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showSignupPassword ? "text" : "password"}
                          className="pr-10"
                          placeholder="Password"
                          {...signupForm.register("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword((prev) => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                          aria-label={
                            showSignupPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showSignupPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {signupForm.formState.errors.password && (
                        <p className="mt-1 text-xs text-red-600">
                          {signupForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Confirm Password</Label>
                      <div className="relative">
                        <Input
                          type={showSignupConfirmPassword ? "text" : "password"}
                          className="pr-10"
                          placeholder="Confirm Password"
                          {...signupForm.register("confirmPassword")}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowSignupConfirmPassword((prev) => !prev)
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                          aria-label={
                            showSignupConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showSignupConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {signupForm.formState.errors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600">
                          {signupForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      Password must be at least 6 characters with 1 uppercase
                      letter and 1 number.
                    </p>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Please wait..." : "Create account"}
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
