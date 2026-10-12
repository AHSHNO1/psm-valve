import { getMessages } from "@/lib/db";
import MessagesClient from "@/components/admin/MessagesClient";

export default function AdminMessagesPage() {
  const messages = getMessages();
  return <MessagesClient initial={messages} />;
}
