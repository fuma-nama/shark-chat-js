import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import TextField from "@/components/input/TextField";
import { AppLayout } from "@/components/layout/app";
import { Spinner } from "@/components/Spinner";
import { label } from "@/components/system/text";
import useProfile from "@/utils/auth/use-profile";
import { trpc } from "@/utils/trpc";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { NextPageWithLayout } from "./_app";

const Settings: NextPageWithLayout = () => {
    const { status, profile } = useProfile();
    const [edit, setEdit] = useState(false);

    if (status !== "authenticated") return <></>;

    if (edit) {
        return (
            <UpdateProfile
                initialName={profile.name ?? ""}
                onCancel={() => setEdit(false)}
            />
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
            <h2 className="font-bold text-2xl">{profile.name}</h2>
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
    initialName,
    onCancel,
}: {
    initialName: string;
    onCancel: () => void;
}) {
    const [name, setName] = useState(initialName);
    const updateMutation = trpc.account.updateProfile.useMutation();

    const onSave = () => {
        updateMutation.mutate({
            name,
        });
    };

    return (
        <div className="flex flex-col gap-3 max-w-2xl">
            <fieldset>
                <label htmlFor="username" className={label()}>
                    Username
                </label>
                <TextField
                    id="username"
                    placeholder={initialName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </fieldset>
            <div className="flex flex-row gap-3 mt-3">
                <Button
                    color="primary"
                    onClick={onSave}
                    disabled={updateMutation.isLoading}
                >
                    {updateMutation.isLoading && (
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
