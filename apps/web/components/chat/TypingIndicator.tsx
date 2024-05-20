import { useEffect, useRef, useState } from "react";
import { Avatar } from "ui/components/avatar";
import { type TypingUser, useMessageStore } from "@/utils/stores/chat";

function useTypingStatus(channelId: string): TypingUser[] {
  const [typing, setTyping] = useState<TypingUser[]>([]);
  const data = useMessageStore((s) => s.typing.get(channelId) ?? []);
  const update = useRef<() => void>();

  update.current = () =>
    setTyping(data.filter((item) => Date.now() - item.timestamp <= 5000));

  useEffect(() => {
    const timer = setInterval(() => update.current?.(), 5000);

    return () => {
      clearInterval(timer);
    };
  }, [channelId]);

  useEffect(() => {
    update.current?.();
  }, [data]);

  return typing;
}

export function TypingIndicator({ channelId }: { channelId: string }) {
  const typing = useTypingStatus(channelId);
  if (typing.length === 0) return <></>;

  return (
    <div className="flex flex-row gap-1 items-center">
      {typing.map((data) => (
        <Avatar
          key={data.user.id}
          src={data.user.image}
          fallback={data.user.name}
          size="small"
        />
      ))}
      <p className="text-sm text-foreground">is typing...</p>
    </div>
  );
}
