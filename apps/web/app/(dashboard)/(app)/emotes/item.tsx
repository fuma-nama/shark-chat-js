import Image from "next/image";
import { cloudinaryLoader } from "@/utils/cloudinary-loader";
import type { Emote } from "db/schema";
import { emotes } from "shared/media/format";
import { getTimeString } from "ui/utils/time";
import { Popover } from "ui/components/popover";
import { Check, Copy } from "lucide-react";
import { button } from "ui/components/button";
import { input } from "ui/components/input";
import { useCopyText } from "ui/hooks/use-copy-text";
import { Serialize } from "@trpc/server/shared";

export function Item({ emote }: { emote: Serialize<Emote> }) {
  return (
    <Popover
      trigger={
        <button className="flex flex-row gap-2 text-left bg-card rounded-lg p-2 transition-colors hover:bg-accent">
          <Image
            src={emotes.url([emote.id], "default")}
            alt={emote.name}
            width={50}
            height={50}
            className="rounded-lg flex-shrink-0"
            loader={cloudinaryLoader}
          />

          <div className="w-0 flex-1">
            <p className="font-medium truncate text-sm mb-2">{emote.name}</p>
            <p className="text-muted-foreground text-xs">
              {getTimeString(new Date(emote.timestamp))}
            </p>
          </div>
        </button>
      }
    >
      <EmoteUsage emote={emote} />
    </Popover>
  );
}

function EmoteUsage({ emote }: { emote: Serialize<Emote> }) {
  const { copy, isShow } = useCopyText();
  const usage = `<!em!${emote.id}>`;

  return (
    <div>
      <p className="text-sm font-medium mb-1">Use This Emote</p>
      <p className="text-xs text-muted-foreground mb-2">
        Type this in your chat to use it.
      </p>
      <div className="flex flex-row gap-2">
        <input className={input()} value={usage} readOnly />
        <button
          aria-label="Copy"
          className={button({ size: "icon" })}
          onClick={() => copy(usage)}
        >
          {isShow ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}
