"use client";

import { useState, type FormEvent } from "react";
import { Activity, KeyRound, RefreshCw, ShieldAlert, UserRound } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { PasswordInput, StrengthMeter } from "@/components/password-input";
import { Button, Card, CardHeader, Dialog, ErrorBanner, Input, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useChangePassword, useHealth, useMe, useUpdateProfile } from "@/lib/queries";
import type { User } from "@/lib/types";
import { useAuthActions } from "@/lib/use-auth";
import { cn, errorText, formatDate } from "@/lib/utils";

export function SettingsView() {
  const { data: me, isPending } = useMe();
  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-6">
      <PageHeader title="Settings" description="Manage your profile and account security." />
      {isPending || !me ? (
        <Card className="space-y-4 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </Card>
      ) : (
        <>
          <ProfileCard key={me.updated_at} me={me} />
          <PasswordCard />
          <ServiceCard />
          <DangerCard me={me} />
        </>
      )}
    </div>
  );
}

function ProfileCard({ me }: { me: User }) {
  const update = useUpdateProfile();
  const [form, setForm] = useState({ first_name: me.first_name, last_name: me.last_name, email: me.email });
  const dirty =
    form.first_name !== me.first_name || form.last_name !== me.last_name || form.email !== me.email;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    update.mutate(
      { id: me.id, ...form, email: form.email.trim() },
      { onSuccess: () => toast.success("Profile updated") },
    );
  }

  return (
    <Card>
      <CardHeader icon={<UserRound className="size-4" />} title="Profile" description={`Member since ${formatDate(me.created_at)}`} />
      <form onSubmit={onSubmit} className="space-y-4 p-5">
        {update.error && <ErrorBanner message={errorText(update.error)} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <Input label="Last name" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div className="flex justify-end gap-2 pt-1">
          {dirty && (
            <Button type="button" variant="ghost" onClick={() => setForm({ first_name: me.first_name, last_name: me.last_name, email: me.email })}>
              Reset
            </Button>
          )}
          <Button type="submit" disabled={!dirty} loading={update.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (next.length < 8) return setClientError("New password must be at least 8 characters.");
    if (next !== confirm) return setClientError("Passwords don't match.");
    setClientError(null);
    change.mutate(
      { current, next },
      {
        onSuccess: () => {
          toast.success("Password changed");
          setCurrent("");
          setNext("");
          setConfirm("");
        },
      },
    );
  }

  const error = clientError ?? (change.error ? errorText(change.error) : null);

  return (
    <Card>
      <CardHeader icon={<KeyRound className="size-4" />} title="Password" description="Use a long, unique password." />
      <form onSubmit={onSubmit} className="space-y-4 p-5">
        {error && <ErrorBanner message={error} />}
        <PasswordInput label="Current password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <PasswordInput label="New password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} />
            <StrengthMeter password={next} />
          </div>
          <PasswordInput label="Confirm new password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <div className="flex justify-end pt-1">
          <Button type="submit" loading={change.isPending} disabled={!current || !next || !confirm}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}

function DangerCard({ me }: { me: User }) {
  const { logout } = useAuthActions();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const remove = useMutation({
    mutationFn: () => api.deleteUser(me.id),
    onSuccess: () => {
      toast.success("Your account has been deleted");
      logout();
    },
  });

  return (
    <Card className="border-rose-200 dark:border-rose-500/25">
      <CardHeader
        icon={<ShieldAlert className="size-4" />}
        title="Delete account"
        description="Permanently remove your account and all of its documents."
        action={
          <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
            Delete account
          </Button>
        }
      />
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setTyped("");
        }}
        title="Delete your account?"
        description={
          <>
            This can&apos;t be undone. Type <span className="font-mono font-medium text-fg">{me.email}</span> to confirm.
          </>
        }
      >
        {remove.error && <ErrorBanner className="mb-4" message={errorText(remove.error)} />}
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={me.email} aria-label="Confirm email" />
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={typed !== me.email} loading={remove.isPending} onClick={() => remove.mutate()}>
            Delete forever
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}

const CHECK_LABELS: Record<string, string> = {
  database: "Database",
  redis: "Job queue (Redis)",
  storage: "File storage",
};

/** What GET /health reports: handy when uploads or answers start failing. */
function ServiceCard() {
  const health = useHealth();
  const data = health.data;
  const ok = data?.status === "ok";
  return (
    <Card>
      <CardHeader
        icon={<Activity className="size-4" />}
        title="Service status"
        description="Whether the DocFlow API and the services it depends on are reachable."
        action={
          <Button variant="secondary" size="sm" onClick={() => health.refetch()} loading={health.isFetching}>
            {!health.isFetching && <RefreshCw className="size-3.5" />} Check again
          </Button>
        }
      />
      <div className="p-5">
        {health.isPending ? (
          <div className="space-y-2.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-40" />
          </div>
        ) : health.error ? (
          <ErrorBanner message={errorText(health.error)} />
        ) : data ? (
          <>
            <p className={cn("text-sm font-medium", ok ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
              {ok ? "All systems working" : "Some services aren't responding"}
            </p>
            <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
              {Object.entries(data.checks).map(([name, state]) => (
                <li key={name} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                  <span className="text-fg">{CHECK_LABELS[name] ?? name}</span>
                  <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", state === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    <span className={cn("size-1.5 rounded-full", state === "ok" ? "bg-emerald-500" : "bg-rose-500")} />
                    {state === "ok" ? "OK" : "Not responding"}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </Card>
  );
}
