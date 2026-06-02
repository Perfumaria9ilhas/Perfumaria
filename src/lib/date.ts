export function getAzoresDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Atlantic/Azores",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
