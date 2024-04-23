import { Avatar } from "ui/components/avatar";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";

import type { NextPageWithLayout } from "../../_app";
import { useDirectMessageLayout } from "@/components/layout/dm";
import { MessageList } from "@/components/chat/MessageList";

const DMPage: NextPageWithLayout = () => {
  const { channel } = useRouter().query as { channel: string };

  return <MessageList channelId={channel} welcome={<Welcome />} />;
};

function Welcome() {
  const { channel } = useRouter().query as { channel: string };
  const query = trpc.dm.info.useQuery(
    { channelId: channel },
    { enabled: false }
  );

  const data = query.data;

  if (!data?.user) return <div></div>;

  return (
    <div className="flex flex-col mb-8">
      <Avatar
        src={data?.user?.image}
        fallback={data?.user?.name}
        size="large"
        className="mb-4"
      />
      <h1 className="text-lg lg:text-xl font-bold">{data.user.name}</h1>
      <p className="text-muted-foreground text-sm">
        Start your conversations with {data.user.name}
      </p>
    </div>
  );
}

DMPage.useLayout = useDirectMessageLayout;

export default DMPage;
