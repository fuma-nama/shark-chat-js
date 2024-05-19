import { Navbar } from "@/components/layout/Navbar";
import { Emotes } from "db/schema";
import { desc } from "drizzle-orm";
import { CreateEmoteModal } from "@/components/modal/CreateEmoteModal";
import { Item } from "./page.client";

export default async function Page() {
  const result = await db
    .select()
    .from(Emotes)
    .orderBy(desc(Emotes.timestamp))
    .limit(50);

  return (
    <>
      <Navbar breadcrumb={[{ id: "emotes", text: "Emotes" }]} />
      <div className="p-4">
        <div className="flex flex-row">
          <CreateEmoteModal />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-8">
          {result.map((emote) => (
            <Item key={emote.id} emote={emote} />
          ))}
        </div>
      </div>
    </>
  );
}
