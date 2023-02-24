import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import TextField from "@/components/input/TextField";
import { AppLayout } from "@/components/layout/app";
import { Spinner } from "@/components/Spinner";
import { label } from "@/components/system/text";
import { trpc } from "@/utils/trpc";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { NextPageWithLayout } from "./_app";

const Settings: NextPageWithLayout = () => {
    const { status, data } = useSession();
    const [edit, setEdit] = useState(false);

    if (status !== "authenticated") return <></>;
    const user = data.user;

    if (edit) {
        return <UpdateProfile onCancel={() => setEdit(false)} />;
    }

    return (
        <div className="flex flex-col gap-3">
            <Avatar
                size="large"
                alt="avatar"
                src={user.image ?? undefined}
                fallback={user.name ?? undefined}
            />
            <h2 className="font-bold text-2xl">{user.name}</h2>
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

function UpdateProfile({ onCancel }: { onCancel: () => void }) {
    const { data } = useSession();
    const initialName = data?.user.name ?? "";

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
