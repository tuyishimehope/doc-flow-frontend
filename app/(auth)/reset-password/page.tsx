"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button, ErrorBanner, buttonClass } from "@/components/ui";
import { PasswordInput, StrengthMeter } from "@/components/password-input";
import { api } from "@/lib/api";
import { errorText } from "@/lib/utils";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: () => api.resetPassword(token, password) });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setClientError("Password must be at least 8 characters.");
    if (password !== confirm) return setClientError("Passwords don't match.");
    setClientError(null);
    mutation.mutate();
  }

  if (!token) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Invalid reset link</h1>
        <p className="mt-2 text-sm text-muted">
          This link is missing its token. Request a new one to continue.
        </p>
        <Link href="/forgot-password" className={buttonClass("primary", "lg") + " mt-8 w-full"}>
          Request a new link
        </Link>
      </>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-fg">Password updated</h1>
        <p className="mt-2 text-sm text-muted">{mutation.data.message}</p>
        <Link href="/login" className={buttonClass("primary", "lg") + " mt-8 w-full"}>
          Sign in
        </Link>
      </div>
    );
  }

  const error = clientError ?? (mutation.error ? errorText(mutation.error) : null);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-muted">Make it at least 8 characters.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && <ErrorBanner message={error} />}
        <div className="space-y-2">
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <StrengthMeter password={password} />
        </div>
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
          Update password
        </Button>
      </form>
      <Link href="/login" className="mt-8 flex items-center justify-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </>
  );
}
