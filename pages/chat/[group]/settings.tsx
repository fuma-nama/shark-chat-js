import Avatar from "@/components/Avatar";
import { useGroupLayout } from "@/components/layout/group";
import { NextPageWithLayout } from "@/pages/_app";
import { groupIcon } from "@/utils/media";
import { trpc } from "@/utils/trpc";
import { CldImage } from "next-cloudinary";
import { useRouter } from "next/router";
import { getQuery } from ".";

const Settings: NextPageWithLayout = () => {
    const router = useRouter();
    const { groupId } = getQuery(router);
    const query = trpc.group.info.useQuery({ groupId });

    if (query.data == null) {
        return <></>;
    }

    const info = query.data;
    return (
        <>
            {info.icon_hash != null && (
                <CldImage
                    src={groupIcon.url([groupId], info.icon_hash)}
                    width={50}
                    height={50}
                    alt={info.name}
                    className="rounded-full"
                />
            )}
            <h2 className="text-xl">{info.name}</h2>
        </>
    );
};

Settings.useLayout = (children) =>
    useGroupLayout((group) => ({
        title: "Settings",
        breadcrumb: [{ href: `/chat/${group}/settings`, text: "Settings" }],
        children,
    }));
export default Settings;
