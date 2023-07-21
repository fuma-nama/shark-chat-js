"use client";

import { GithubIcon } from "lucide-react";
import { ClientSafeProvider, signIn } from "next-auth/react";
import { Button } from "ui/components/button";

export function LoginButton({
    provider,
    callbackUrl,
}: {
    provider: ClientSafeProvider;
    callbackUrl?: string;
}) {
    return (
        <Button
            onClick={() => signIn(provider.id, { callbackUrl })}
            color="primary"
        >
            {provider.id === "github" && (
                <GithubIcon className="w-6 h-6 mr-2" />
            )}
            Sign in with {provider.name}
        </Button>
    );
}
