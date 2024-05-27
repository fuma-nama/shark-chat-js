import { ReactParser, ReactRenderer } from "marked-react";
import Link from "next/link";
import { Fragment, useRef } from "react";
import { Marked } from "marked";
import Image from "next/image";
import { cloudinaryLoader } from "@/utils/cloudinary-loader";
import { emotes } from "shared/media/format";
import "highlight.js/styles/atom-one-dark.min.css";
import "katex/dist/katex.min.css";
import { CopyIcon } from "lucide-react";
import { button } from "ui/components/button";
import { showToast } from "@/utils/stores/page";

const emoteRegex = /\\?:(\w+?):/g;

function emote(key: number, id: string, inline: boolean) {
  // escape
  if (id.startsWith("\\")) return id.slice(1);

  const discordPrefix = "discord_";
  if (id.startsWith(discordPrefix)) {
    return (
      <img
        key={key}
        alt={id}
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
      alt={id}
      width={50}
      height={50}
      src={emotes.url([id], "default")}
      className={inline ? "inline my-0 mx-1 size-6" : "m-0"}
      loader={cloudinaryLoader}
    />
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const ref = useRef<HTMLElement | null>();

  return (
    <pre className={`relative language-${lang} text-dark-50 bg-dark-900`}>
      <code
        ref={(element) => {
          ref.current = element;
          if (!element || !lang) return;

          import("highlight.js/lib/common").then(async (res) => {
            element.innerHTML = res.default.highlight(lang, code, true).value;
          });
        }}
      >
        {code}
      </code>
      <button
        onClick={() => {
          const element = ref.current;
          if (element)
            navigator.clipboard.writeText(element.innerText).then(() => {
              showToast({
                description: "Copied",
                variant: "normal",
              });
            });
        }}
        className={button({
          color: "secondary",
          size: "icon",
          className: "absolute top-2 right-2",
        })}
      >
        <CopyIcon className="size-4" />
      </button>
    </pre>
  );
}

const renderer: Partial<ReactRenderer> = {
  code(code, lang) {
    if (typeof code !== "string") return <></>;

    if (lang === "math") {
      return (
        <div
          key={mdRenderer.elementId}
          ref={(element) => {
            if (!element) return;
            // @ts-ignore
            import("katex/dist/katex.min.js").then((res: import("katex")) => {
              res.render(code, element);
            });
          }}
        >
          <div className="p-2 text-sm bg-card rounded-lg">Loading Katex...</div>
        </div>
      );
    }

    return <CodeBlock key={mdRenderer.elementId} lang={lang} code={code} />;
  },
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
