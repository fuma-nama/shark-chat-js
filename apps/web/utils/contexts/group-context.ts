import { createContext, useContext } from "react";
import { GroupWithNotifications } from "server/routers/group/group";
import { Serialize } from "shared/types";

export const GroupContext = createContext<
  Serialize<GroupWithNotifications> | undefined
>(undefined);

export function useGroupContext(): Serialize<GroupWithNotifications> {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("Missing Group context");
  return ctx;
}
