"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button, ErrorBanner, Input } from "@/components/ui";
import { PasswordInput, StrengthMeter } from "@/components/password-input";
import { api } from "@/lib/api";
import { useAuthActions } from "@/lib/use-auth";
import { errorText } from "@/lib/utils";

export function SignupForm() {
  const { login } = useAuthActions();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [clientError, setClientError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const data = { ...form, email: form.email.trim() };
      await api.signup(data);
      await login(data.email, data.password);
    },
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      setClientError("Password must be at least 8 characters.");
      return;
    }
    setClientError(null);
    mutation.mutate();
  }

  const error = clientError ?? (mutation.error ? errorText(mutation.error) : null);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted">Start extracting data from documents in minutes.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && <ErrorBanner message={error} />}
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" autoComplete="given-name" required value={form.first_name} onChange={set("first_name")} />
          <Input label="Last name" autoComplete="family-name" required value={form.last_name} onChange={set("last_name")} />
        </div>
        <Input
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          value={form.email}
          onChange={set("email")}
        />
        <div className="space-y-2">
          <PasswordInput
            label="Password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={set("password")}
            hint={form.password ? undefined : "At least 8 characters."}
          />
          <StrengthMeter password={form.password} />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
          Create account <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
