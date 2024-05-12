import { UserInfo } from "shared/schema/chat";
import { useRef } from "react";

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
      className="flex flex-col mb-2 overflow-hidden max-w-full border-l-2 border-brand p-2 bg-secondary rounded-lg cursor-pointer"
      onClick={onClick}
    >
      <p className="font-medium text-xs mb-1">{user?.name ?? "Unknown User"}</p>
      <p className="whitespace-nowrap text-xs truncate text-muted-foreground">
        {content ?? "Message Deleted"}
      </p>
    </div>
  );
}
