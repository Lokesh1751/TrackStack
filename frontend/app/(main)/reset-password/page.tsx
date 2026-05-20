"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader } from "lucide-react";

import { resetPassword, validateResetOtp, generateResetOtp } from "@/lib/api";

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
import { useToast } from "@/hooks/useToast";

const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
});

const passwordSchema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string().min(1),
});

type OtpFormValues = z.infer<typeof otpSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const [verifiedOtpData, setVerifiedOtpData] = useState<{
    email: string;
    otp: string;
  } | null>(null);

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: "", otp: "" },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const email = searchParams.get("email");
    if (email) otpForm.setValue("email", email);

    const stored = sessionStorage.getItem("otp_expiry");
    if (stored) setExpiry(new Date(stored));
  }, []);

  useEffect(() => {
    if (!expiry) return;

    const interval = setInterval(() => {
      const diff = expiry.getTime() - Date.now();
      setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [expiry]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const validateOtpMutation = useMutation({
    mutationFn: validateResetOtp,
    onSuccess: (_d, v) => {
      setVerifiedOtpData(v);
      setStep(2);
      toast.success("OTP verified");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success("Password reset successful");
      router.push("/");
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: (email: string) => generateResetOtp(email),
    onSuccess: (data) => {
      setExpiry(new Date(data.resetTokenExpiry));
      sessionStorage.setItem("otp_expiry", data.resetTokenExpiry);
      toast.success("OTP resent");
    },
  });

  const onVerify = (data: OtpFormValues) => {
    validateOtpMutation.mutate(data);
  };

  const onReset = (data: PasswordFormValues) => {
    if (!verifiedOtpData) return;

    resetMutation.mutate({
      email: verifiedOtpData.email,
      otp: verifiedOtpData.otp,
      newPassword: data.password,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            {step === 1 ? "Verify OTP" : "Set new password"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            <form
              onSubmit={otpForm.handleSubmit(onVerify)}
              className="space-y-4"
            >
              <div>
                <Label>Email</Label>
                <Input {...otpForm.register("email")} />
              </div>

              <div>
                <div className="flex justify-between mb-1 items-center">
                  <Label>OTP</Label>

                  {timeLeft > 0 && (
                    <span className="text-xs text-slate-500 mb-1">
                      Expires in {formatTime(timeLeft)}
                    </span>
                  )}
                </div>

                <Input {...otpForm.register("otp")} maxLength={6} />
              </div>

              {timeLeft === 0 && (
                <div className="text-right">
                  <button
                    type="button"
                    className="text-xs text-black cursor-pointer"
                    onClick={() =>
                      resendOtpMutation.mutate(otpForm.getValues("email"))
                    }
                  >
                    {resendOtpMutation.isPending ? <Loader /> : "Resend Otp"}
                  </button>
                </div>
              )}

              <Button
                className="w-full"
                disabled={validateOtpMutation.isPending}
              >
                {validateOtpMutation.isPending ? "Verifying..." : "Continue"}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={passwordForm.handleSubmit(onReset)}
              className="space-y-4"
            >
              <div>
                <Label>New Password</Label>
                <Input {...passwordForm.register("password")} />
              </div>

              <div>
                <Label>Confirm Password</Label>
                <Input {...passwordForm.register("confirmPassword")} />
              </div>

              <Button className="w-full" disabled={resetMutation.isPending}>
                {resetMutation.isPending
                  ? "Reseting Password..."
                  : "Reset Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
