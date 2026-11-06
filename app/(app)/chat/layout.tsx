import type { Metadata } from "next";
import { ChatLayout } from "./chat-layout";

export const metadata: Metadata = { title: "Chat" };

export default function Layout({ children }: LayoutProps<"/chat">) {
  return <ChatLayout>{children}</ChatLayout>;
}
