import { ReactParser, ReactRenderer } from "marked-react";
import Link from "next/link";
import { Fragment, useRef } from "react";
import { Marked } from "marked";
import Image from "next/image";
import { cloudinaryLoader } from "@/utils/cloudinary-loader";
import { emotes } from "shared/media/format";
import "highlight.js/styles/github-dark.min.css";
import "katex/dist/katex.min.css";
import { Check, CopyIcon } from "lucide-react";
import { button } from "ui/components/button";
import { useCopyText } from "ui/hooks/use-copy-text";

const emoteRegex = /\\?:(\w+?):/g;

function emote(key: number, id: string, inline: boolean) {
  // escape
  if (id.startsWith("\\")) return id.slice(1);

  const discordPrefix = "discord_";
  const isDiscord = id.startsWith(discordPrefix);

  return (
    <Image
      key={key}
      alt={id}
      width={50}
      height={50}
      src={
        isDiscord
          ? `https://cdn.discordapp.com/emojis/${id.slice(discordPrefix.length)}?size=240&quality=lossless`
          : emotes.url([id], "default")
      }
      unoptimized={isDiscord}
      className={inline ? "inline my-0 mx-1 size-6" : "m-0"}
      loader={isDiscord ? undefined : cloudinaryLoader}
    />
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const ref = useRef<HTMLElement | null>();
  const { isShow, copy } = useCopyText();

  return (
    <pre className={`relative not-prose text-[13px] language-${lang}`}>
      <code
        className="hljs rounded-lg"
        ref={(element) => {
          ref.current = element;
          if (!element || !lang) return;

          import("highlight.js/lib/common").then(async (res) => {
            element.innerHTML = res.default.highlight(code, {
              language: lang,
              ignoreIllegals: true,
            }).value;
          });
        }}
      >
        {code}
      </code>
      <button
        onClick={() => {
          const element = ref.current;
          if (element) void copy(element.innerText);
        }}
        className={button({
          color: "secondary",
          size: "icon",
          className: "absolute top-2 right-2",
        })}
      >
        {isShow ? (
          <Check className="size-4" />
        ) : (
          <CopyIcon className="size-4" />
        )}
      </button>
    </pre>
  );
}

const renderer: Partial<ReactRenderer> = {
  code(code, lang) {
    if (typeof code !== "string") return <></>;

    if (lang === "math") {
      return (
        <pre
          key={mdRenderer.elementId}
          className="not-prose overflow-auto"
          ref={(element) => {
            if (!element) return;
            // @ts-ignore
            import("katex/dist/katex.min.js").then((res: import("katex")) => {
              res.render(code, element);
            });
          }}
        >
          <div className="p-2 text-sm bg-card rounded-lg">Loading Katex...</div>
        </pre>
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
