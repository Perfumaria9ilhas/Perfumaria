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
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  return { dateKey, start: getAzoresDateStart(dateKey), end: getAzoresDateStart(tomorrow) };
}

// Find the first instant of the local date, including a skipped or repeated
// midnight during the Azores daylight-saving transitions.
export function getAzoresDateStart(dateKey: string) {
  const midnight = Date.parse(`${dateKey}T00:00:00Z`);
  let before = midnight - 12 * 3600000;
  let after = midnight + 12 * 3600000;
  while (after - before > 1) {
    const middle = Math.floor((before + after) / 2);
    if (getAzoresDateKey(new Date(middle)) < dateKey) before = middle;
    else after = middle;
  }
  return new Date(after);
}
