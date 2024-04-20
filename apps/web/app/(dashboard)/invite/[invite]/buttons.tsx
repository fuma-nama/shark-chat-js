"use client";
import { trpc } from "@/utils/trpc/app-router";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "ui/components/button";

export function InviteButton({
  query,
  type,
}: {
  type: "code" | "name";
  query: string;
}) {
  const router = useRouter();
  const joinMutation = trpc.group.join.useMutation({
    onSuccess: (res) => router.push(`/chat/${res.id}`),
  });
  const joinByNameMutation = trpc.group.joinByUniqueName.useMutation({
    onSuccess: (res) => router.push(`/chat/${res.id}`),
  });

  const onClick = () => {
    if (type === "code") {
      joinMutation.mutate({ code: query });
    } else if (type === "name") {
      joinByNameMutation.mutate({ uniqueName: query });
    }
  };

  return (
    <Button
      color="primary"
      className="w-full mt-3"
      isLoading={joinMutation.isLoading || joinByNameMutation.isLoading}
      onClick={onClick}
    >
      Accept
    </Button>
  );
}

export function LoginButton() {
  return (
    <Button color="primary" className="w-full mt-3" onClick={() => signIn()}>
      Login
    </Button>
  );
}
