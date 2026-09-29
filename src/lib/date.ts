export function getAzoresDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Atlantic/Azores",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getAzoresDayBounds(date = new Date()) {
  const dateKey = getAzoresDateKey(date);
  const [year, month, day] = dateKey.split("-").map(Number);
  const resolveMidnight = (offsetDays: number) => {
    const wanted = new Date(Date.UTC(year, month - 1, day + offsetDays));
    let candidate = new Date(wanted);
    for (let index = 0; index < 2; index += 1) {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Atlantic/Azores", year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
      }).formatToParts(candidate);
      const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
      const represented = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
      candidate = new Date(candidate.getTime() + (wanted.getTime() - represented));
    }
    return candidate;
  };
  return { dateKey, start: resolveMidnight(0), end: resolveMidnight(1) };
}
