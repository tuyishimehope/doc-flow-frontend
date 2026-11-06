import { AppShell } from "@/components/app-shell";
import { ChatProvider } from "@/components/chat-provider";
import { RequireAuth } from "@/components/guards";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <RequireAuth>
      <ChatProvider>
        <AppShell>{children}</AppShell>
      </ChatProvider>
    </RequireAuth>
  );
}
