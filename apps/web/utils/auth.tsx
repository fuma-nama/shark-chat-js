import { createContext, useContext, useMemo } from "react";
import { User } from "next-auth";
import { trpc } from "@/utils/trpc";

export const SessionContext = createContext<Result>({
  status: "unauthenticated",
  data: undefined,
});

type Result =
  | {
      status: "authenticated";
      data: {
        user: User;
      };
    }
  | {
      status: "loading" | "unauthenticated";
      data: undefined;
    };

export function useSession(): Result {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const query = trpc.account.get.useQuery(undefined, {
    staleTime: Infinity,
  });

  const result = useMemo<Result>(() => {
    if (query.isLoading)
      return {
        status: "loading",
        data: undefined,
      };
    if (query.isError)
      return {
        status: "unauthenticated",
        data: undefined,
      };
    return {
      status: "authenticated",
      data: {
        user: query.data,
      },
    };
  }, [query.data, query.isLoading, query.isError]);

  return (
    <SessionContext.Provider value={result}>{children}</SessionContext.Provider>
  );
}
