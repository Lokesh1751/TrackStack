"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { resetPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";

const otpSchema = z.object({
  email: z.string().email("Enter a valid email"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Minimum 6 characters")
      .regex(/[A-Z]/, "Must include at least one uppercase letter")
      .regex(/[0-9]/, "Must include at least one number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type OtpFormValues = z.infer<typeof otpSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [verifiedOtpData, setVerifiedOtpData] = useState<{
    email: string;
    otp: string;
  } | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Prefill email from query if user comes from forgot-password flow.
  useEffect(() => {
    const email = searchParams.get("email");
    if (email) {
      otpForm.setValue("email", email);
    }
  }, [otpForm, searchParams]);

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      setMessage({ type: "success", text: "Password updated successfully." });
      setTimeout(() => router.push("/"), 1500);
    },
    onError: (err: Error) => {
      toast.error("Password reset failed", {
        description: err?.message || "Something went wrong.",
      });
    },
  });

  const onContinueFromOtp = (data: OtpFormValues) => {
    setMessage(null);
    setVerifiedOtpData({ email: data.email, otp: data.otp });
    setStep(2);
  };

  const onResetPassword = (data: PasswordFormValues) => {
    if (!verifiedOtpData) {
      toast.error("OTP verification required", {
        description: "Complete OTP verification first.",
      });
      setStep(1);
      return;
    }

    mutation.mutate({
      email: verifiedOtpData.email,
      otp: verifiedOtpData.otp,
      newPassword: data.password,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-blue-700">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-medium">
              Step {step} of 2
            </span>
          </div>
          <CardTitle className="text-xl">
            {step === 1 ? "Verify OTP" : "Set New Password"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Enter your email and the 6-digit OTP sent to your inbox."
              : "Create a strong password to secure your account."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            <form
              onSubmit={otpForm.handleSubmit(onContinueFromOtp)}
              className="space-y-4"
            >
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...otpForm.register("email")}
                />
                {otpForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {otpForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label>OTP</Label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  {...otpForm.register("otp")}
                />
                {otpForm.formState.errors.otp && (
                  <p className="mt-1 text-xs text-red-600">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          ) : (
            <form
              onSubmit={passwordForm.handleSubmit(onResetPassword)}
              className="space-y-4"
            >
              <div>
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="pr-10"
                    placeholder="Enter new password"
                    {...passwordForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    className="pr-10"
                    placeholder="Re-enter new password"
                    {...passwordForm.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <p className="text-xs text-slate-500">
                Use at least 6 characters, including 1 uppercase letter and 1 number.
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep(1)}
                  disabled={mutation.isPending}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Updating..." : "Reset Password"}
                </Button>
              </div>
            </form>
          )}

          {message && (
            <p
              className={`mt-4 text-sm ${
                message.type === "success" ? "text-green-700" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}