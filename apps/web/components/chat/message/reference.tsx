import { UserInfo } from "shared/schema/chat";
import { useCallback, useContext, useMemo, useRef } from "react";
import { CornerUpRight } from "lucide-react";
import { render } from "@/components/chat/message/markdown";
import { ScrollContext } from "@/components/chat/MessageList";

export function Reference({
  id,
  user,
  content,
}: {
  id: number;
  user?: UserInfo | null;
  content?: string;
}) {
  const timeoutRef = useRef<number>();
  const children = useMemo(
    () => render(content ?? "Message Deleted"),
    [content],
  );
  const { scrollToMessage } = useContext(ScrollContext)!;

  const onClick = useCallback(() => {
    scrollToMessage(id);
    window.setTimeout(() => {
      const element = document.getElementById(`message_${id}`);
      if (!element) return;

      element.style.setProperty("background-color", "hsl(var(--primary)/.2)");
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

      timeoutRef.current = window.setTimeout(() => {
        element.style.removeProperty("background-color");
      }, 500);
    }, 100);
  }, [id, scrollToMessage]);

  return (
    <div
      className="relative mb-2 overflow-hidden pl-7 p-2 bg-accent/50 rounded-lg cursor-pointer"
      onClick={onClick}
    >
      <CornerUpRight className="absolute top-2 left-2 size-4 text-muted-foreground" />
      <p className="font-medium text-xs truncate mb-1">
        {user?.name ?? "Unknown User"}
      </p>
      <div className="prose prose-message opacity-50 origin-top-left w-[110%] scale-90 max-h-[90px] [mask-image:linear-gradient(to_bottom,white_50px,transparent)] pointer-events-none">
        {children}
      </div>
    </div>
  );
}
