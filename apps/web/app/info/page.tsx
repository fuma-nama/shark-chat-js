import Image from "next/image";
import GridImage from "@/public/grid.svg";
import {
  PaintbrushIcon,
  ArrowRightIcon,
  GithubIcon,
  ImageIcon,
  MailIcon,
} from "lucide-react";
import PreviewImage from "@/public/preview-1.png";
import PreviewLightImage from "@/public/preview-light.png";
import Link from "next/link";
import { cn } from "ui/utils/cn";

export default function InfoPage() {
  return (
    <div className="relative flex flex-col w-full max-w-screen-2xl mx-auto px-6 py-4 md:px-8 gap-3 min-h-screen">
      <div className="sticky top-0 left-0 right-0 py-2 flex flex-row items-center z-50 rounded-xl bg-light-100/30 dark:bg-dark-900/30 -mx-2 px-2 backdrop-blur-xl">
        <div className="w-8 h-8 mr-2 bg-brand rounded-full" />
        <p className="font-semibold text-xl">Shark Chat</p>

        <Link
          href="/home"
          className="bg-brand-400 rounded-md font-base px-3 py-1 font-semibold ml-auto text-accent-50"
        >
          Login
        </Link>
      </div>
      <Hero />
      <SupportedChannels />
      <Features />
      <div className="-mt-[60px] h-[300px] bg-gradient-to-br from-brand-200 to-brand-500 -mx-6 md:-mx-8" />
      <div className="z-[2] -mt-[100px] mb-[50px] grid grid-cols-1 lg:grid-cols-2 gap-6 text-accent-50">
        <div className="bg-gradient-to-br from-black via-black to-orange-900 px-7 py-6 rounded-xl flex flex-col gap-3">
          <h2 className="font-bold text-2xl">Lighting Fast</h2>
          <p className="text-accent-600">
            Using Redis, Drizzle ORM to provide incredible loading speed
          </p>
          <div className="flex flex-row gap-3 mt-auto">
            <Link
              href="https://github.com/fuma-nama/shark-chat-js#shark-chat"
              target="_blank"
            >
              See Tech Stack <ArrowRightIcon className="inline w-5 h-5" />
            </Link>
          </div>
        </div>
        <div className="bg-dark-800 px-7 py-6 rounded-xl flex flex-col gap-3">
          <h2 className="font-bold text-2xl">Support My Work</h2>
          <p className="text-accent-600">
            Feel free to star the repository if you like it
          </p>
          <div className="flex flex-row gap-3 mt-auto">
            <Link
              href="https://github.com/fuma-nama/shark-chat-js"
              target="_blank"
            >
              Go to Github <ArrowRightIcon className="inline w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
      <p className="text-accent-900 dark:text-accent-50 mx-auto text-sm">
        Made with ❤️ by Money Shark
      </p>
    </div>
  );
}

function MessageBubble({ className }: { className?: string }) {
  return (
    <svg
      width="162.19084mm"
      height="91.04966mm"
      viewBox="0 0 182.19084 111.04966"
      className={cn(className, "drop-shadow-2xl")}
    >
      <g id="layer1" transform="translate(-3.7594938,-48.584229)">
        <path
          id="rect1170"
          d="m 21.052495,54.946631 c -2.93158,0 -5.291667,2.360087 -5.291667,5.291667 v 72.992962 c 0,2.93158 2.360087,5.29167 5.291667,5.29167 H 139.7822 l 35.61281,15.03784 -11.85716,-31.10301 V 60.238298 c 0,-2.93158 -2.36008,-5.291667 -5.29166,-5.291667 z"
          className="fill-white dark:fill-brand-100 stroke-2 stroke-brand-300"
        />
        <text x="25" y="85" className="text-accent-900 text-2xl font-bold">
          Hello
        </text>
      </g>
    </svg>
  );
}

function Hero() {
  return (
    <div className="relative z-[2] mt-20">
      <Image
        alt="grid"
        src={GridImage}
        priority
        className={cn(
          "absolute -z-[1] right-0 bottom-[50px] max-h-[700px] w-full max-lg:opacity-50 lg:w-[65%] lg:-top-[100px]",
          "[mask-image:radial-gradient(circle_at_center,_white,_transparent_80%)]",
        )}
      />
      <MessageBubble className="absolute -z-[1] right-0 top-0 max-lg:hidden max-xl:max-w-[400px] xl:top-[150px]" />
      <h1 className="text-4xl md:text-6xl font-bold !leading-snug">
        The Serverless{" "}
        <p className="bg-clip-text bg-gradient-to-br from-brand-100 to-brand-400 text-transparent w-fit">
          Web Messaging
        </p>
      </h1>
      <p className="mt-3 text-base md:text-lg text-muted-foreground">
        Shark Chat is an open-source Chat app built with Next.js and Tailwind
        CSS
      </p>
      <div className="flex flex-row gap-3 mt-6">
        <Link
          href="/home"
          className="text-accent-50 bg-brand-400 font-medium text-base px-8 py-2.5 rounded-lg"
        >
          Try Now
        </Link>

        <Link
          href="https://github.com/fuma-nama/shark-chat-js"
          target="_blank"
          className="text-accent-50 bg-dark-700 font-medium text-base px-8 py-2.5 rounded-lg flex flex-row items-center"
        >
          <GithubIcon className="mr-2 w-5 h-5" />
          Github
        </Link>
      </div>
    </div>
  );
}

function SupportedChannels() {
  return (
    <div className="z-[2] w-full xl:w-[50%] mt-10 lg:mt-28 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-2xl p-4">
        <p className="text-lg font-semibold">Chat Group</p>
        <p className="text-base text-accent-800 dark:text-accent-600 mt-2">
          Interact with other peoples in your group
        </p>
      </div>
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-2xl p-4">
        <p className="text-lg font-semibold">Direct Message</p>
        <p className="text-base text-accent-800 dark:text-accent-600 mt-2">
          Talk with your friend directly and privately
        </p>
      </div>
    </div>
  );
}

function Features() {
  return (
    <>
      <div className="relative mt-20 lg:mt-40 text-center overflow-hidden">
        <div className="dark:hidden">
          <Image
            alt="preview"
            src={PreviewLightImage}
            priority
            className={cn(
              "mx-auto w-[80%] min-w-[800px] max-w-full rounded-xl shadow-2xl",
              "[mask-image:linear-gradient(to_bottom,_white_50%,_transparent_100%)]",
            )}
          />
        </div>
        <div className="hidden dark:block">
          <Image
            alt="preview"
            src={PreviewImage}
            priority
            className={cn(
              "mx-auto w-[80%] min-w-[800px] max-w-full rounded-xl shadow-2xl",
              "[mask-image:linear-gradient(to_bottom,_white_50%,_transparent_100%)]",
            )}
          />
        </div>

        <div className="absolute left-0 right-0 bottom-[20%]">
          <h2 className="font-bold text-4xl md:text-5xl leading-snug">
            <p className="text-transparent bg-clip-text bg-gradient-to-t from-brand-200 to-brand-400">
              All the Features
            </p>
            You Need
          </h2>
        </div>
      </div>
      <div className="relative w-full mx-auto -mt-12 xl:-mt-24 z-[2] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:w-[80%] gap-4">
        {[
          {
            name: "Customize Profile & Chat Group",
            description:
              "Create your own personalized profile and group info with one click",
            icon: (
              <PaintbrushIcon className="text-brand w-14 h-14 p-2 bg-light-100 dark:bg-dark-900 rounded-xl" />
            ),
          },
          {
            name: "Group Invites",
            description:
              "Easily invite Group Members with a short url or an invite code",
            icon: (
              <MailIcon className="text-brand w-14 h-14 p-2 bg-light-100 dark:bg-dark-900 rounded-xl" />
            ),
          },
          {
            name: "Send Images & Videos",
            description:
              "Share memories and photos with your Friends from anywhere",
            icon: (
              <ImageIcon className="text-brand w-14 h-14 p-2 bg-light-100 dark:bg-dark-900 rounded-xl" />
            ),
          },
        ].map((v, i) => (
          <div
            key={i}
            className="rounded-xl bg-white dark:bg-dark-800 shadow-xl p-4 dark:border-[1px] border-dark-700"
          >
            {v.icon}
            <p className="font-semibold text-lg">{v.name}</p>
            <p className="text-accent-800 dark:text-accent-600 text-base">
              {v.description}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
