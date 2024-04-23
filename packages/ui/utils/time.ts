export function getTimeString(date: Date) {
  const now = new Date(Date.now());
  const isToday =
    now.getDate() === date.getDate() &&
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear();
  const day = isToday
    ? "Today"
    : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

  return `${day} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}
