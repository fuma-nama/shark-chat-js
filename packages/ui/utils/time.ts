export function getTimeString(date: Date) {
  const now = new Date(Date.now());
  const today =
    now.getDate() === date.getDate() &&
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear();

  return `${today ? "Today" : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`} ${date.getHours()}:${date.getMinutes()}`;
}
