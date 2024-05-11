import Link from "next/link";
import { button } from "ui/components/button";

export default function InfoPage() {
  return (
    <div className="relative flex flex-col mx-auto px-6 py-4 gap-3 min-h-screen bg-gradient-to-t from-brand/30 md:px-8">
      <div className="sticky top-0 left-0 right-0 py-2 flex flex-row items-center z-50 rounded-xl bg-light-100/30 dark:bg-dark-900/30 -mx-2 px-2 backdrop-blur-xl">
        <div className="w-8 h-8 mr-2 bg-brand rounded-full" />
        <p className="font-semibold">Shark Chat</p>

        <Link
          href="/"
          className={button({ color: "primary", className: "ml-auto" })}
        >
          Login
        </Link>
      </div>
      <Hero />
      <a
        href="https://github.com/fuma-nama"
        rel="noreferrer noopener"
        target="_blank"
        className="mt-auto mx-auto text-sm"
      >
        Built with ❤️ by Fuma
      </a>
    </div>
  );
}

function Hero() {
  return (
    <div className="relative z-[2] flex flex-col items-center text-center mt-20">
      <h1 className="text-4xl lg:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-foreground to-brand font-bold !leading-snug">
        The Serverless
        <br />
        Web Messaging
      </h1>
      <p className="mt-3 text-sm md:text-base text-muted-foreground text-center">
        Shark Chat is an open-source chat app built with Next.js and Tailwind
        CSS.
      </p>
      <div className="flex flex-row gap-3 mt-6">
        <Link href="/" className={button({ size: "large", color: "primary" })}>
          Try Now
        </Link>

        <Link
          href="https://github.com/fuma-nama/shark-chat-js"
          target="_blank"
          rel="noreferrer noopener"
          className={button({ size: "large" })}
        >
          <svg role="img" viewBox="0 0 24 24" className="size-5 mr-2">
            <path
              fill="currentColor"
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
            />
          </svg>
          Github
        </Link>
      </div>
    </div>
  );
}
