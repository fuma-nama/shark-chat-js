import { useSession } from "@/utils/auth";
import { BaseRealtime } from "ably/modular";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AblyMessageCallback } from "ably/react";

const Context = createContext<BaseRealtime | undefined>(undefined);

export function useAbly(): BaseRealtime | undefined {
  return useContext(Context);
}

export function AblyClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ably, setAbly] = useState<BaseRealtime>();
  const { status } = useSession();
  useEffect(() => {
    import("./lazy").then((res) => {
      setAbly(res.default);
    });
  }, []);

  useEffect(() => {
    if (!ably) return;
    const connected = ably.connection.state === "connected";

    if (!connected && status === "authenticated") {
      ably.connect();
    }

    if (connected && status === "unauthenticated") {
      ably.close();
    }
  }, [ably, status]);

  return <Context.Provider value={ably}>{children}</Context.Provider>;
}

export function useCallbackRef(fn: AblyMessageCallback): AblyMessageCallback {
  const ref = useRef(fn);
  ref.current = fn;

  return useCallback((params) => ref.current(params), []);
}
