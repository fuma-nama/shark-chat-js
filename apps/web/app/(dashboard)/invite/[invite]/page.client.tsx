"use client";
import { Group } from "db/schema";
import { cloudinaryLoader } from "@/utils/cloudinary-loader";
import Image from "next/image";
import { groupBanners } from "shared/media/format";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc/app-router";
import { Button } from "ui/components/button";
import { signIn } from "next-auth/react";

export function BannerImage({ group }: { group: Group }) {
  if (!group.banner_hash) return <></>;

  return (
    <Image
      src={groupBanners.url([group.id], group.banner_hash)}
      alt="Banner"
      loader={cloudinaryLoader}
      fill
      sizes="(max-width: 800px) 100vw, 800px"
      className="blur-lg object-cover"
      priority
    />
  );
}

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
    <Button
      color="primary"
      className="w-full mt-3"
      onClick={() => signIn(undefined, { redirect: true })}
    >
      Login
    </Button>
  );
}
