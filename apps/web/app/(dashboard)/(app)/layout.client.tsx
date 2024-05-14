"use client";
import { usePageStore } from "@/utils/stores/page";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "ui/components/toast";
import React from "react";
import { TooltipProvider } from "ui/components/tooltip";

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={100}>
      <ToastManager />
      {children}
    </TooltipProvider>
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
