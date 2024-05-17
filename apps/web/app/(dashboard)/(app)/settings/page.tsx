"use client";
import { Avatar } from "ui/components/avatar";
import { Button } from "ui/components/button";
import { ImagePicker } from "@/components/input/ImagePicker";
import { useProfile } from "@/utils/hooks/use-profile";
import { trpc } from "@/utils/trpc";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { User } from "db/schema";
import { Serialize } from "shared/types";
import { useUpdateProfileMutation } from "@/utils/hooks/mutations/update-profile";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { fieldset, input } from "ui/components/input";
import { SimpleDialog } from "ui/components/dialog";
import { AlertDialog } from "ui/components/alert-dialog";
import { Navbar } from "@/components/layout/Navbar";

export default function Settings() {
  const { status, profile } = useProfile();
  const [edit, setEdit] = useState(false);

  if (status !== "authenticated") return <></>;

  return (
    <>
      <Navbar breadcrumb={[{ id: "settings", text: "Settings" }]} />
      <div className="flex flex-col gap-6 p-4">
        <Avatar size="large" src={profile.image} fallback={profile.name} />
        <div>
          <h2 className="font-semibold text-lg mb-1">{profile.name}</h2>
          <p className="text-muted-foreground text-sm">{profile.email}</p>
        </div>
        <div className="flex flex-row gap-3">
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
    </>
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

function UpdateProfile({
  profile,
  onCancel,
}: {
  profile: Serialize<User>;
  onCancel: () => void;
}) {
  const [name, setName] = useState<string>(profile.name);
  const [avatar, setAvatar] = useState<string>();
  const utils = trpc.useUtils();
  const mutation = useUpdateProfileMutation();

  const onSave = () => {
    return mutation.mutate(
      { name, avatar },
      {
        onSuccess(data) {
          utils.account.get.setData(undefined, () => data);
          onCancel();
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 pt-4">
      <ImagePicker
        previewClassName="mx-auto max-w-[150px]"
        value={avatar ?? profile.image}
        onChange={setAvatar}
      />

      <fieldset>
        <label htmlFor="username" className="text-xs font-medium">
          Username
        </label>
        <input
          id="username"
          placeholder={profile.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={input()}
        />
      </fieldset>
      <div className="flex flex-row gap-3 mt-3">
        <Button color="primary" onClick={onSave} isLoading={mutation.isLoading}>
          Save Changes
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
