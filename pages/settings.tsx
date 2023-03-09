import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import { ImagePicker } from "@/components/input/ImagePicker";
import TextField from "@/components/input/TextField";
import { AppLayout } from "@/components/layout/app";
import { Spinner } from "@/components/Spinner";
import { label } from "@/components/system/text";
import useProfile from "@/utils/auth/use-profile";
import { trpc } from "@/utils/trpc";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { NextPageWithLayout } from "./_app";
import { User } from "@prisma/client";
import { Serialize } from "@/utils/types";
import { useUpdateProfileMutation } from "@/utils/media/upload";

const Settings: NextPageWithLayout = () => {
    const { status, profile } = useProfile();
    const [edit, setEdit] = useState(false);

    if (status !== "authenticated") return <></>;

    if (edit) {
        return (
            <UpdateProfile profile={profile} onCancel={() => setEdit(false)} />
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <Avatar
                size="large"
                alt="avatar"
                src={profile.image ?? undefined}
                fallback={profile.name ?? undefined}
            />
            <div>
                <h2 className="font-bold text-2xl">{profile.name}</h2>
                <p className="text-accent-800 dark:text-accent-600 text-base">
                    {profile.email}
                </p>
            </div>
            <div className="flex flex-row gap-3 mt-3">
                <Button color="primary" onClick={() => setEdit(true)}>
                    Edit Profile
                </Button>
                <Button color="danger" onClick={() => signOut()}>
                    Logout
                </Button>
            </div>
        </div>
    );
};

function UpdateProfile({
    profile,
    onCancel,
}: {
    profile: Serialize<User>;
    onCancel: () => void;
}) {
    const [name, setName] = useState<string>(profile.name);
    const [avatar, setAvatar] = useState<string | undefined>();
    const utils = trpc.useContext();
    const mutation = useUpdateProfileMutation();

    const onSave = () => {
        return mutation.mutate(
            { name, avatar },
            {
                onSuccess(data) {
                    utils.account.get.setData(undefined, () => data);
                    onCancel();
                },
            }
        );
    };

    return (
        <div className="flex flex-col gap-3 max-w-2xl">
            <ImagePicker
                previewClassName="max-w-[150px] max-h-[150px]"
                value={avatar ?? profile.image}
                onChange={setAvatar}
            />

            <fieldset>
                <label htmlFor="username" className={label()}>
                    Username
                </label>
                <TextField
                    id="username"
                    placeholder={profile.name}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </fieldset>
            <div className="flex flex-row gap-3 mt-3">
                <Button
                    color="primary"
                    onClick={onSave}
                    disabled={mutation.isLoading}
                >
                    {mutation.isLoading && (
                        <div className="mr-2 inline">
                            <Spinner size="small" />
                        </div>
                    )}
                    Save Changes
                </Button>
                <Button onClick={onCancel}>Cancel</Button>
            </div>
        </div>
    );
}

Settings.useLayout = (children) => (
    <AppLayout title="Settings">{children}</AppLayout>
);

export default Settings;
