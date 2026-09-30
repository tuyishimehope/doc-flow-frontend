"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, ShieldAlert, UserRound } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { PasswordInput, StrengthMeter } from "@/components/password-input";
import { Button, Card, CardHeader, Dialog, ErrorBanner, Input, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useChangePassword, useMe, useUpdateProfile } from "@/lib/queries";
import type { User } from "@/lib/types";
import { useAuthActions } from "@/lib/use-auth";
import { errorText, formatDate } from "@/lib/utils";

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
