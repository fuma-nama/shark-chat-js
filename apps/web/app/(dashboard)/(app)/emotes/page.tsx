"use client";
import { Navbar } from "@/components/layout/Navbar";
import { CreateEmoteModal } from "@/components/modal/CreateEmoteModal";
import { Item } from "./item";
import { trpc } from "@/utils/trpc";
import { Spinner } from "ui/components/spinner";

const count = 50;
export default function Page() {
  const query = trpc.emotes.get.useQuery({ count });

  return (
    <>
      <Navbar breadcrumb={[{ id: "emotes", text: "Emotes" }]} />
      <div className="flex flex-col p-4">
        <div className="flex flex-row">
          <CreateEmoteModal />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-8">
          {query.isLoading && (
            <Spinner className="col-span-full" size="large" />
          )}
          {query.data?.map((emote) => <Item key={emote.id} emote={emote} />)}
        </div>
      </div>
    </>
  );
}
