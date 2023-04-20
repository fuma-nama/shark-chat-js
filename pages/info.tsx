import { BaseLayout } from "@/components/layout/base";
import { NextPageWithLayout } from "./_app";
import Image from "next/image";
import GridImage from "@/public/grid.svg";
import {
    ArrowRightIcon,
    GitHubLogoIcon,
    ImageIcon,
} from "@radix-ui/react-icons";
import clsx from "clsx";
import PreviewImage from "@/public/preview-1.png";
import PreviewLightImage from "@/public/preview-light.png";
import Link from "next/link";

function MessageBubble({ className }: { className?: string }) {
    return (
        <svg
            width="162.19084mm"
            height="91.04966mm"
            viewBox="0 0 182.19084 111.04966"
            className={clsx(className, "drop-shadow-2xl")}
        >
            <g id="layer1" transform="translate(-3.7594938,-48.584229)">
                <path
                    id="rect1170"
                    d="m 21.052495,54.946631 c -2.93158,0 -5.291667,2.360087 -5.291667,5.291667 v 72.992962 c 0,2.93158 2.360087,5.29167 5.291667,5.29167 H 139.7822 l 35.61281,15.03784 -11.85716,-31.10301 V 60.238298 c 0,-2.93158 -2.36008,-5.291667 -5.29166,-5.291667 z"
                    className="fill-white dark:fill-brand-100 stroke-2 stroke-brand-300"
                />
                <text
                    x="25"
                    y="85"
                    className="text-accent-900 text-2xl font-bold"
                >
                    Hello
                </text>
            </g>
        </svg>
    );
}

function PaintingIcon() {
    return (
        <svg
            className="fill-brand-400 w-14 h-14 p-2 bg-light-100 dark:bg-dark-900 rounded-xl"
            height="800px"
            width="800px"
            viewBox="0 0 612 612"
        >
            <g>
                <path
                    d="M590.253,398.519l-46.635-46.635l47.511-47.511c5.583-5.581,5.585-14.631,0-20.213L311.156,4.187
		c-5.583-5.583-14.635-5.583-20.211,0l-123.314,123.31c-5.585,5.585-5.585,14.631,0,20.216l279.976,279.971
		c5.581,5.586,14.63,5.586,20.211,0l38.401-38.402l27.937,27.937l-78.505,78.505l-162.69-162.686
		c-4.959-4.959-11.686-7.746-18.7-7.746s-13.74,2.788-18.699,7.747l-33.679,33.679c-14.017-13.677-36.467-13.591-50.363,0.301
		L24.494,514.046c-13.996,13.999-13.992,36.704,0.004,50.7L61.252,601.5c13.999,13.996,36.704,14.003,50.703,0.004l147.02-147.027
		c13.898-13.894,13.976-36.341,0.305-50.362l14.982-14.982l162.69,162.685c5.163,5.163,11.933,7.746,18.7,7.746
		c6.767,0,13.535-2.583,18.7-7.746l115.904-115.901c4.959-4.959,7.746-11.686,7.746-18.699
		C597.999,410.205,595.212,403.479,590.253,398.519z"
                />
            </g>
        </svg>
    );
}

function InviteIcon() {
    return (
        <svg
            width="800px"
            height="800px"
            viewBox="0 0 24 24"
            className="w-14 h-14 p-2 bg-light-100 dark:bg-dark-900 rounded-xl"
        >
            <g stroke="none" stroke-width="1" fill="none">
                <path
                    d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z"
                    id="MingCute"
                    fill-rule="nonzero"
                ></path>
                <path
                    d="M17,3 C18.597725,3 19.903664,4.24892392 19.9949075,5.82372764 L20,6 L20,10.3501 L20.5939,10.0862 C21.2076,9.813435 21.9162954,10.2366962 21.9931452,10.8836127 L22,11 L22,19 C22,20.0543909 21.18415,20.9181678 20.1492661,20.9945144 L20,21 L4,21 C2.94563773,21 2.08183483,20.18415 2.00548573,19.1492661 L2,19 L2,11 C2,10.3284056 2.6746366,9.85267997 3.29700147,10.045194 L3.40614,10.0862 L4,10.3501 L4,6 C4,4.40232321 5.24892392,3.09633941 6.82372764,3.00509271 L7,3 L17,3 Z M17,5 L7,5 C6.44772,5 6,5.44772 6,6 L6,11.239 L12,13.9057 L18,11.239 L18,6 C18,5.44772 17.5523,5 17,5 Z M12,8 C12.5523,8 13,8.44772 13,9 C13,9.51283143 12.613973,9.93550653 12.1166239,9.9932722 L12,10 L10,10 C9.44772,10 9,9.55228 9,9 C9,8.48716857 9.38604429,8.06449347 9.88337975,8.0067278 L10,8 L12,8 Z"
                    id="Shape"
                    className="fill-brand-400"
                ></path>
            </g>
        </svg>
    );
}

const SharkPage: NextPageWithLayout = () => {
    return (
        <div className="relative flex flex-col max-w-screen-2xl px-2 md:px-4 mx-auto w-full gap-3">
            <div className="sticky top-0 w-full py-2 flex flex-row items-center z-50 rounded-xl bg-light-100/30 dark:bg-dark-900/30 -mx-2 px-2 backdrop-blur-xl">
                <div className="w-8 h-8 mr-2 bg-brand-400 rounded-full" />
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
            <div className="z-[2] -mt-[100px] mb-[100px] grid grid-cols-1 lg:grid-cols-2 gap-6 text-accent-50">
                <div className="bg-gradient-to-br from-black via-black to-orange-900 px-7 py-6 rounded-xl flex flex-col gap-3">
                    <h2 className="font-bold text-2xl">Lighting Fast</h2>
                    <p className="text-accent-600">
                        Using Redis, PlanetScale with Drizzle ORM to provide
                        incredible loading speed
                    </p>
                    <div className="flex flex-row gap-3">
                        <Link
                            href="https://github.com/SonMooSans/shark-chat-js#shark-chat"
                            target="_blank"
                            className=""
                        >
                            See Tech Stack{" "}
                            <ArrowRightIcon className="inline w-5 h-5" />
                        </Link>
                    </div>
                </div>
                <div className="bg-dark-800 px-7 py-6 rounded-xl flex flex-col gap-3">
                    <h2 className="font-bold text-2xl">Support My Work</h2>
                    <p className="text-accent-600">
                        Feel free to star the repository if you like it
                    </p>
                </div>
            </div>
        </div>
    );
};

function Hero() {
    return (
        <div className="relative z-[2] mt-20">
            <Image
                alt="grid"
                src={GridImage}
                priority
                className={clsx(
                    "absolute -z-[1] right-0 bottom-[50px] max-h-[700px] w-full max-lg:opacity-50 lg:w-[65%] lg:-top-[100px]",
                    "[mask-image:radial-gradient(circle_at_center,_white,_transparent_80%)]"
                )}
            />
            <MessageBubble className="absolute -z-[1] right-0 top-0 max-lg:hidden max-xl:max-w-[400px] xl:top-[150px]" />
            <h1 className="text-4xl md:text-6xl font-bold !leading-snug">
                The Serverless{" "}
                <p className="bg-clip-text bg-gradient-to-br from-brand-100 to-brand-400 text-transparent w-fit">
                    Web Messaging
                </p>
            </h1>
            <p className="mt-3 text-base md:text-lg text-accent-800 dark:text-accent-400">
                Shark Chat is an open-source Chat app built with Next.js and
                Tailwind CSS
            </p>
            <div className="flex flex-row gap-3 mt-6">
                <Link
                    href="/home"
                    className="text-accent-50 bg-brand-400 font-bold text-base md:text-lg px-8 py-2.5 rounded-lg"
                >
                    Try Now
                </Link>

                <Link
                    href="https://github.com/SonMooSans/shark-chat-js"
                    target="_blank"
                    className="text-accent-50 bg-dark-700 font-bold text-base md:text-lg px-8 py-2.5 rounded-lg flex flex-row items-center"
                >
                    <GitHubLogoIcon className="mr-2 w-5 h-5" />
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
                        className={clsx(
                            "mx-auto w-[80%] min-w-[800px] max-w-full rounded-xl shadow-2xl",
                            "[mask-image:linear-gradient(to_bottom,_white_50%,_transparent_100%)]"
                        )}
                    />
                </div>
                <div className="hidden dark:block">
                    <Image
                        alt="preview"
                        src={PreviewImage}
                        className={clsx(
                            "mx-auto w-[80%] min-w-[800px] max-w-full rounded-xl shadow-2xl",
                            "[mask-image:linear-gradient(to_bottom,_white_50%,_transparent_100%)]"
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
            <div
                className={clsx(
                    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full xl:w-[80%] gap-4",
                    "relative mx-auto -mt-12 xl:-mt-24 z-[2]"
                )}
            >
                {[
                    {
                        name: "Customize Profile & Chat Group",
                        description:
                            "Create your own personalized profile and group info with one click",
                        icon: <PaintingIcon />,
                    },
                    {
                        name: "Group Invites",
                        description:
                            "Easily invite Group Members with a short url or an invite code",
                        icon: <InviteIcon />,
                    },
                    {
                        name: "Send Images & Videos",
                        description:
                            "Share memories and photos with your Friends from anywhere",
                        icon: (
                            <ImageIcon className="w-14 h-14 p-2 bg-light-100 dark:bg-dark-900 rounded-xl text-brand-400" />
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

SharkPage.useLayout = (c) => <BaseLayout variant="base">{c}</BaseLayout>;
export default SharkPage;
