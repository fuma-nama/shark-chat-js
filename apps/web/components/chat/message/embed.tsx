import { useState } from "react";
import { ImageSkeleton } from "ui/components/image-skeleton";
import type { Embed } from "db/schema";

export function Embed({ embed }: { embed: Embed }) {
  const image = embed.image;

  if (!embed.title && !embed.description && image) {
    return <EmbedImage {...image} />;
  }

  return (
    <div className="bg-card text-card-foreground overflow-hidden mt-3 border-l-primary rounded-lg p-2 border-l-2">
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
      {image ? <EmbedImage {...image} /> : null}
    </div>
  );
}

function EmbedImage(image: Exclude<Embed["image"], undefined>) {
  const [isLoaded, setIsLoaded] = useState(true);

  return (
    <ImageSkeleton
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
    </ImageSkeleton>
  );
}
