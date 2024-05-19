import { ReactParser, ReactRenderer } from "marked-react";
import Link from "next/link";
import { Fragment } from "react";
import { Marked } from "marked";
import Image from "next/image";
import { cloudinaryLoader } from "@/utils/cloudinary-loader";
import { emotes } from "shared/media/format";

const emoteRegex = /\\?:(\w+?):/g;

function emote(key: number, id: string, inline: boolean) {
  // escape
  if (id.startsWith("\\")) return id.slice(1);

  const discordPrefix = "discord_";
  if (id.startsWith(discordPrefix)) {
    return (
      <img
        key={key}
        alt="Emote"
        width={50}
        height={50}
        src={`https://cdn.discordapp.com/emojis/${id.slice(discordPrefix.length)}.webp?size=240&quality=lossless`}
        className={inline ? "inline my-0 mx-1 size-6" : "m-0"}
      />
    );
  }

  return (
    <Image
      key={key}
      alt="Emote"
      width={50}
      height={50}
      src={emotes.url([id], "default")}
      className={inline ? "inline my-0 mx-1 size-6" : "m-0"}
      loader={cloudinaryLoader}
    />
  );
}

const renderer: Partial<ReactRenderer> = {
  text(text) {
    if (typeof text !== "string") return text;

    let a,
      child = [],
      lastIdx = 0;

    while ((a = emoteRegex.exec(text))) {
      child.push(
        text.slice(lastIdx, a.index),
        emote(mdRenderer.elementId, a[1], a[0] !== text),
      );

      lastIdx = a.index + a[0].length;
    }

    child.push(text.slice(lastIdx));

    return child;
  },
  link(href, text) {
    if (href.startsWith(window.location.origin))
      return (
        <Link key={mdRenderer.elementId} href={href}>
          {text}
        </Link>
      );

    return (
      <a
        key={mdRenderer.elementId}
        target="_blank"
        rel="noreferrer noopener"
        href={href}
      >
        {text}
      </a>
    );
  },
  image(src, alt) {
    return (
      <Fragment key={mdRenderer.elementId}>{`![${alt}](${src})`}</Fragment>
    );
  },
};

const marked = new Marked();
const mdRenderer = new ReactRenderer({
  renderer: renderer,
  langPrefix: "language-",
});
const mdParser = new ReactParser({ renderer: mdRenderer });

export function render(text: string) {
  const tokens = marked.lexer(text, {
    breaks: true,
    gfm: true,
  });

  return mdParser.parse(tokens);
}
