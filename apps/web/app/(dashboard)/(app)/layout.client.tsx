"use client";
import { PrivateEventManager } from "@/utils/handlers/realtime/private";
import { GroupEventManager } from "@/utils/handlers/realtime/group";
import { MessageEventManager } from "@/utils/handlers/realtime/chat";
import { AblyClientProvider } from "@/utils/ably/client";
import { usePageStore } from "@/utils/stores/page";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "ui/components/toast";

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <AblyClientProvider>
      <PrivateEventManager />
      <GroupEventManager />
      <MessageEventManager />
      <ToastManager />
      {children}
    </AblyClientProvider>
  );
}

function ToastManager() {
  const messages = usePageStore((s) => s.messages);

  return (
    <ToastProvider>
      <ToastViewport className="gap-4">
        {messages.map((message) => (
          <Toast key={message.id} variant="destructive">
            <div className="grid gap-1">
              <ToastTitle>{message.title}</ToastTitle>
              <ToastDescription>{message.description}</ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        ))}
      </ToastViewport>
    </ToastProvider>
  );
}
