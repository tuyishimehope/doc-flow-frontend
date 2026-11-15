"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button, ErrorBanner, Input } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";
import { useAuthActions } from "@/lib/use-auth";
import { errorText } from "@/lib/utils";

export function LoginForm() {
  const { login } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useMutation({ mutationFn: () => login(email.trim(), password) });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <>
      <h1 className="lp-display text-[2rem] leading-[1.1] font-extrabold text-fg">Welcome back</h1>
      <p className="mt-2 text-[15px] text-muted">Sign in to pick up where you left off.</p>

      <form onSubmit={onSubmit} className="mt-9 space-y-5">
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
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={
            <Link href="/forgot-password" className="text-xs font-medium text-accent hover:underline">
              Forgot password?
            </Link>
          }
        />
        <Button type="submit" size="lg" className="w-full shadow-lg shadow-accent/25" loading={mutation.isPending}>
          Sign in <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
        New to DocFlow?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
