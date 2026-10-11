export type StatisticsNavigation = { period: string; from: string; to: string; day?: string; month?: string; anchor?: string };
export function statisticsDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined;
}
export function shiftStatisticsDay(key: string, amount: number) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function statisticsMonthRange(key: string) {
  const from = `${key.slice(0, 7)}-01`;
  const date = new Date(`${from}T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return { from, to: date.toISOString().slice(0, 10) };
}
export function statisticsOverview(base: StatisticsNavigation, anchor?: string) {
  const date = statisticsDate(anchor);
  if (base.period === "month") return { ...base, ...statisticsMonthRange(date ?? base.from) };
  if (!date) return base;
  if (base.period === "7d" || base.period === "30d") return { ...base, from: shiftStatisticsDay(date, base.period === "7d" ? -6 : -29), to: date };
  if (base.period === "year") return { ...base, from: `${date.slice(0, 4)}-01-01`, to: `${date.slice(0, 4)}-12-31` };
  return base;
}
export function statisticsSelection(overview: StatisticsNavigation, day?: string, month?: string) {
  const selectedMonth = month && /^\d{4}-\d{2}$/.test(month) && statisticsDate(`${month}-01`) && month >= overview.from.slice(0, 7) && month <= overview.to.slice(0, 7) ? month : undefined;
  const context = selectedMonth ? { ...overview, ...statisticsMonthRange(`${selectedMonth}-01`) } : overview;
  const selectedDay = statisticsDate(day);
  return { context, range: selectedDay && selectedDay >= context.from && selectedDay <= context.to ? { ...context, from: selectedDay, to: selectedDay } : context, day: selectedDay && selectedDay >= context.from && selectedDay <= context.to ? selectedDay : undefined, month: selectedMonth };
}
export function statisticsHref(overview: StatisticsNavigation, selection: { day?: string; month?: string; anchor?: string } = {}) {
  const params = new URLSearchParams({ period: overview.period });
  if (overview.period === "custom") { params.set("from", overview.from); params.set("to", overview.to); }
  else params.set("anchor", selection.anchor ?? overview.to);
  if (selection.day) params.set("day", selection.day);
  if (selection.month) params.set("month", selection.month);
  return `/admin/estatisticas?${params}`;
}
