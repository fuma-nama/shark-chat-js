import { MessageType } from "@/utils/types";

export function Reference({ data }: { data: MessageType }) {
  return (
    <div className="flex flex-col mb-2 overflow-hidden max-w-full border-l-2 border-brand p-2 bg-secondary rounded-lg">
      <p className="font-medium text-xs mb-1">
        {data.reply_user?.name ?? "Unknown User"}
      </p>
      <p className="whitespace-nowrap text-xs truncate text-muted-foreground">
        {data.reply_message?.content ?? "Message Deleted"}
      </p>
    </div>
  );
}
