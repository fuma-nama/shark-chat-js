import {useCallback, useRef} from "react";

export function useCallbackRef<T extends Function>(fn: T): T {
  const ref = useRef<T>(fn);
  ref.current = fn;

  return useCallback(
    (...params: any[]) => ref.current(...params),
    [],
  ) as unknown as T;
}
