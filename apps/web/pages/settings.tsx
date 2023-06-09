import { Avatar } from "ui/components/avatar";
import { Button } from "ui/components/button";
import { ImagePicker } from "@/components/input/ImagePicker";
import { AppLayout } from "@/components/layout/app";
import { useProfile } from "@/utils/hooks/use-profile";
import { trpc } from "@/utils/trpc";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { NextPageWithLayout } from "./_app";
import { User } from "db/schema";
import { Serialize } from "shared/types";
import { useUpdateProfileMutation } from "@/utils/hooks/mutations/update-profile";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { input } from "ui/components/input";

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
        <div className="flex flex-col gap-6">
            <Avatar size="large" src={profile.image} fallback={profile.name} />
            <div>
                <h2 className="font-bold text-2xl">{profile.name}</h2>
                <p className="text-accent-800 dark:text-accent-600 text-base">
                    {profile.email}
                </p>
            </div>
            <div className="flex flex-row gap-3">
                <Button color="primary" onClick={() => setEdit(true)}>
                    Edit Profile
                </Button>
                <Button color="danger" onClick={() => signOut()}>
                    Logout
                </Button>
            </div>

            <fieldset className="flex flex-col gap-3 items-start">
                <div>
                    <label
                        htmlFor="theme"
                        className="font-medium text-base text-foreground"
                    >
                        Appearance
                    </label>
                    <p className="text-sm text-muted-foreground">
                        Change the color theme of UI
                    </p>
                </div>
                <ThemeSwitch id="theme" />
            </fieldset>
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
        <div className="flex flex-col gap-3 max-w-3xl">
            <ImagePicker
                previewClassName="max-w-[150px] max-h-[150px]"
                value={avatar ?? profile.image}
                onChange={setAvatar}
            />

            <fieldset>
                <label
                    htmlFor="username"
                    className="text-sm font-medium text-foreground"
                >
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
                <Button
                    color="primary"
                    onClick={onSave}
                    isLoading={mutation.isLoading}
                >
                    Save Changes
                </Button>
                <Button onClick={onCancel}>Cancel</Button>
            </div>
        </div>
    );
}

Settings.useLayout = (children) => (
    <AppLayout breadcrumb={[{ href: "/settings", text: "Settings" }]}>
        {children}
    </AppLayout>
);

export default Settings;
