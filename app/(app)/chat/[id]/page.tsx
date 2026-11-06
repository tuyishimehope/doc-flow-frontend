import { ChatThread } from "../chat-thread";

export default async function ConversationPage({ params }: PageProps<"/chat/[id]">) {
  const { id } = await params;
  return <ChatThread key={id} conversationId={Number(id)} />;
}
