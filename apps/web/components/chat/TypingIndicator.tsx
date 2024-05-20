import { useEffect, useRef, useState } from "react";
import { Avatar } from "ui/components/avatar";
import { type TypingUser, useMessageStore } from "@/utils/stores/chat";
import { useSession } from "next-auth/react";

function useTypingStatus(channelId: string): TypingUser[] {
  const [typing, setTyping] = useState<TypingUser[]>([]);
  const data = useMessageStore((s) => s.typing.get(channelId));
  const update = useRef<() => void>();
  const { data: session } = useSession();

  update.current = () => {
    if (!session) return;

    setTyping(
      data?.filter(
        (item) =>
          Date.now() - item.timestamp <= 5000 &&
          item.user.id !== session.user.id,
      ) ?? [],
    );
  };

  useEffect(() => {
    const timer = setInterval(() => update.current?.(), 1000);

    return () => {
      clearInterval(timer);
    };
  }, [channelId]);

  useEffect(() => {
    update.current?.();
  }, [data, session]);

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
