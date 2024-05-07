import { MessageType } from "@/utils/types";
import { UserInfo } from "shared/schema/chat";

export function Reference({ user, content }: { user?: UserInfo | null, content?: string }) {
  return (
    <div className="flex flex-col mb-2 overflow-hidden max-w-full border-l-2 border-brand p-2 bg-secondary rounded-lg">
      <p className="font-medium text-xs mb-1">
        {user?.name ?? "Unknown User"}
      </p>
      <p className="whitespace-nowrap text-xs truncate text-muted-foreground">
        {content ?? "Message Deleted"}
      </p>
    </div>
  );
}
