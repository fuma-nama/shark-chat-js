import { MessageType } from "@/utils/types";

export function Reference({ data }: { data: MessageType }) {
  if (data.reply_message == null) {
    return (
      <div className="border-l-2 border-slate-500 p-2 rounded-md">
        <p className="text-sm text-muted-foreground">Message Deleted</p>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-2 items-center overflow-hidden max-w-full border-l-2 border-slate-500 p-2 rounded-md">
      <p className="font-medium text-sm text-muted-foreground">
        {data.reply_user?.name ?? "Unknown User"}
      </p>
      <p className="whitespace-nowrap text-sm text-muted-foreground">
        {data.reply_message.content}
      </p>
    </div>
  );
}
