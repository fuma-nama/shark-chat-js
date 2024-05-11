export function getMessageVariables(channelId: string) {
  return {
    channelId: channelId,
    count: 30,
    cursorType: "before",
  } as const;
}
