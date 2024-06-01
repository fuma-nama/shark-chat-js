"use client";
import { Avatar } from "ui/components/avatar";
import { Button } from "ui/components/button";
import { useProfile } from "@/utils/hooks/use-profile";
import { trpc } from "@/utils/trpc";
import { signOut } from "next-auth/react";
import React, { useState } from "react";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { fieldset } from "ui/components/input";
import { SimpleDialog } from "ui/components/dialog";
import { AlertDialog } from "ui/components/alert-dialog";
import { BannerImage } from "@/components/BannerImage";
import { userBanners } from "shared/media/format";
import { UpdateProfile } from "@/app/(dashboard)/(app)/settings/update-info";

export default function Settings() {
  const { status, profile } = useProfile();
  const [edit, setEdit] = useState(false);

  if (status !== "authenticated") return <></>;

  return (
    <main className="flex flex-col max-w-screen-sm gap-6 sm:px-4">
      <div className="flex flex-col px-4 pb-8 bg-card overflow-hidden sm:rounded-xl">
        <BannerImage
          url={userBanners.url([profile.id], profile.banner_hash)}
          className="aspect-[4]"
        />
        <Avatar
          size="large"
          src={profile.image}
          fallback={profile.name}
          className="-mt-12 border-4 border-card"
        />
        <h2 className="text-lg font-semibold mt-2">{profile.name}</h2>
        <p className="text-muted-foreground text-sm mt-1">{profile.email}</p>
        <div className="flex flex-row mt-6 gap-3">
          <SimpleDialog
            open={edit}
            onOpenChange={setEdit}
            title="Update Profile"
            trigger={<Button color="primary">Edit Profile</Button>}
          >
            <UpdateProfile profile={profile} onCancel={() => setEdit(false)} />
          </SimpleDialog>

          <Button onClick={() => signOut()}>Logout</Button>
        </div>
      </div>
      <div className="flex flex-col px-4 gap-6">
        <fieldset className="flex flex-col gap-4 items-start">
          <div>
            <label htmlFor="theme" className={fieldset().label()}>
              Appearance
            </label>
            <p className={fieldset().description()}>
              Change the color theme of UI
            </p>
          </div>
          <ThemeSwitch id="theme" />
        </fieldset>
        <DangerZone />
      </div>
    </main>
  );
}

function DangerZone() {
  const mutation = trpc.account.delete.useMutation({
    onSuccess() {
      return signOut();
    },
  });

  return (
    <fieldset className="flex flex-col items-start gap-4">
      <div>
        <label htmlFor="delete_bn" className={fieldset().label()}>
          Delete Account
        </label>
        <p className={fieldset().description()}>
          Clear all associated data and profile info.
        </p>
      </div>
      <AlertDialog
        title="Do you sure to delete account?"
        description="This action cannot be reversed."
        action={
          <Button color="danger" onClick={() => mutation.mutate()}>
            Delete
          </Button>
        }
      >
        <Button id="delete_bn" isLoading={mutation.isLoading} color="danger">
          Delete
        </Button>
      </AlertDialog>
    </fieldset>
  );
}
