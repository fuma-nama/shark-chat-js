import { UserInfo } from "shared/schema/chat";
import { useRef } from "react";
import { CornerUpRight } from "lucide-react";

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

  const onClick = () => {
    const element = document.getElementById(`message_${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });

      element.style.setProperty("background-color", "hsl(var(--accent))");
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

      timeoutRef.current = window.setTimeout(() => {
        element.style.removeProperty("background-color");
      }, 500);
    }
  };

  return (
    <div
      className="relative flex flex-col gap-1 mb-2 overflow-hidden max-w-full pl-7 p-2 bg-secondary rounded-lg cursor-pointer"
      onClick={onClick}
    >
      <CornerUpRight className="absolute top-2 left-2 size-4 text-muted-foreground" />
      <p className="font-medium text-xs truncate">
        {user?.name ?? "Unknown User"}
      </p>
      <p className="text-xs truncate text-muted-foreground">
        {content ?? "Message Deleted"}
      </p>
    </div>
  );
}
