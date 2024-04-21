import { UserInfo } from "shared/schema/chat";
import { useState, useEffect } from "react";
import { Avatar } from "ui/components/avatar";

type TypingData = {
  user: UserInfo;
  timestamp: Date;
};

export function useTypingStatus() {
  const [typing, setTyping] = useState<TypingData[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      const last = new Date(Date.now());
      last.setSeconds(last.getSeconds() - 5);

      setTyping((prev) => prev.filter((data) => data.timestamp >= last));
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return {
    typing,
    add: (user: UserInfo) => {
      const data: TypingData = {
        user,
        timestamp: new Date(Date.now()),
      };

      setTyping((prev) =>
        prev.some((u) => u.user.id === data.user.id) ? prev : [...prev, data],
      );
    },
  };
}

export function TypingIndicator({ typing }: { typing: TypingData[] }) {
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
