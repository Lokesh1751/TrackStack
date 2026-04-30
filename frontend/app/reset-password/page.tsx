"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";

import { resetPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  password: z.string().min(6, "Minimum 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // ✅ Extract token properly (important fix)
  useEffect(() => {
    const t = searchParams.get("token");
    setToken(t);
  }, [searchParams]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      setMessage("Password updated successfully ✅");
      setTimeout(() => router.push("/"), 1500);
    },
    onError: (err: Error) => { 
      setMessage(err?.message || "Something went wrong ❌");
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!token) {
      setMessage("Invalid or missing token ❌");
      return;
    }

    mutation.mutate({
      token,
      newPassword: data.password,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        <h2 className="text-xl font-semibold">Reset Password</h2>

        {!token && (
          <p className="text-red-600 text-sm">
            Invalid reset link. Please request again.
          </p>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>New Password</Label>
            <Input type="password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-xs text-red-600">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || !token}
          >
            {mutation.isPending ? "Updating..." : "Reset Password"}
          </Button>
        </form>

        {message && <p className="text-sm">{message}</p>}
      </div>
    </div>
  );
}