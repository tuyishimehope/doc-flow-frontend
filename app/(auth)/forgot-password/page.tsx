"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button, ErrorBanner, Input } from "@/components/ui";
import { api } from "@/lib/api";
import { errorText } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const mutation = useMutation({ mutationFn: () => api.forgotPassword(email.trim()) });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  if (mutation.isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
          <MailCheck className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-fg">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{mutation.data.message}</p>
        <Link href="/login" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Reset your password</h1>
      <p className="mt-1.5 text-sm text-muted">
        Enter your email and we&apos;ll send you a link to choose a new password.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {mutation.error && <ErrorBanner message={errorText(mutation.error)} />}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
          Send reset link
        </Button>
      </form>
      <Link href="/login" className="mt-8 flex items-center justify-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </>
  );
}
