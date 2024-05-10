import clsx from "clsx";
import { useState } from "react";
import { SmartImage } from "ui/components/smart-image";
import type { Embed } from "db/schema";

export function Embed({ embed }: { embed: Embed }) {
  const [isLoaded, setIsLoaded] = useState(true);
  const imageOnly = !embed.title && !embed.description && embed.image != null;
  const image = embed.image;

  return (
    <div
      className={clsx(
        "bg-card text-card-foreground overflow-hidden mt-3 border-l-primary rounded-lg",
        !imageOnly && "p-2 border-l-2",
      )}
    >
      {embed.title && (
        <a
          href={embed.url}
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium text-sm"
        >
          {embed.title}
        </a>
      )}
      {embed.description && (
        <p className="text-muted-foreground text-xs">{embed.description}</p>
      )}
      {image != null && (
        <SmartImage
          loaded={isLoaded}
          width={image.width}
          height={image.height}
          maxWidth={400}
          maxHeight={200}
        >
          <img
            alt="image"
            src={image.url}
            onLoad={() => setIsLoaded(true)}
            className="size-full"
          />
        </SmartImage>
      )}
    </div>
  );
}
