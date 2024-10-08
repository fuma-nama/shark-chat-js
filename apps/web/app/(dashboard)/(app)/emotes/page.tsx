"use client";
import { CreateEmoteModal } from "@/components/modal/CreateEmoteModal";
import { Item } from "./item";
import { trpc } from "@/utils/trpc";
import { Spinner } from "ui/components/spinner";
import { Button } from "ui/components/button";

const count = 50;
export default function Page() {
  const query = trpc.emotes.get.useInfiniteQuery(
    { limit: count },
    {
      getNextPageParam: (last, all) =>
        last.length === 50 ? all.length * count : undefined,
    },
  );

  return (
    <div className="flex flex-col p-4 gap-4">
      <p className="text-sm text-muted-foreground">
        Upload custom emotes and use them in chat.
      </p>
      <div className="flex flex-row">
        <CreateEmoteModal />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
        {query.isLoading && <Spinner className="col-span-full" size="large" />}
        {query.data?.pages.flatMap((block) =>
          block.map((emote) => <Item key={emote.id} emote={emote} />),
        )}
      </div>
      {query.hasNextPage ? (
        <Button
          isLoading={query.isFetchingNextPage}
          className="mx-auto"
          onClick={() => query.fetchNextPage()}
        >
          Load More
        </Button>
      ) : null}
    </div>
  );
}
