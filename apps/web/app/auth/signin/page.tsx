import { getProviders } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "server/auth";
import clsx from "clsx";
import { redirect } from "next/navigation";
import { LoginButton } from "./login_bn";

export default async function SignInPage() {
    const session = await getServerSession(authOptions);

    // If the user is already logged in, redirect.
    // Note: Make sure not to redirect to the same page
    // To avoid an infinite loop!
    if (session) {
        redirect("/home");
    }

    const providers = await getProviders().then((res) =>
        Object.values(res ?? {})
    );

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-light-50 to-light-400 dark:from-dark-600 dark:to-dark-950 p-4">
            <div
                className={clsx(
                    "flex flex-col gap-2 sm:gap-4 text-center p-6 max-w-lg border-[1px] rounded-xl bg-card/50 shadow-lg"
                )}
            >
                <h1 className="text-xl font-bold">Login to Shark Chat</h1>
                <p className="mb-2 text-muted-foreground text-sm">
                    Login or register an account to start your life on Shark
                    Chat
                </p>
                {providers?.map((provider) => (
                    <LoginButton key={provider.id} provider={provider} />
                ))}
            </div>
        </div>
    );
}
