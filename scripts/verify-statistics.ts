import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { getAzoresDateKey, getAzoresDayBounds } from "../src/lib/date";
import { getStatisticsData, previousStatisticsRange, resolveStatisticsRange } from "../src/lib/statistics";

// Read-only reconciliation: no inserts, updates, deletes or migrations.
async function verify() {
  const movements = await prisma.stockMovement.findMany({ where: { type: "SALE" }, select: { id: true, saleGroupId: true, createdAt: true, saleStatus: true, quantity: true, saleUnitPriceInCents: true, reason: true, notes: true } });
  const ranges = ["today", "7d", "30d", "month", "year"].map((period) => resolveStatisticsRange({ period }));
  ranges.push(resolveStatisticsRange({ period: "custom", from: "2026-09-12", to: "2026-09-23" }));
  const today = getAzoresDateKey();
  assert.equal(ranges[0].from, today);
  assert.equal(ranges[0].to, today);
  assert.equal(resolveStatisticsRange({ period: "custom", from: "2026-02-30", to: today }).to, today);
  assert.notEqual(resolveStatisticsRange({ period: "custom", from: "2026-02-30", to: today }).from, "2026-02-30");
  assert.deepEqual(previousStatisticsRange({ from: "2026-03-29", to: "2026-03-29" }), { from: "2026-03-28", to: "2026-03-28" });
  assert.deepEqual(previousStatisticsRange({ from: "2026-10-25", to: "2026-10-25" }), { from: "2026-10-24", to: "2026-10-24" });
  for (const [date, hours] of [["2026-03-29", 23], ["2026-10-25", 25]] as const) {
    const bounds = getAzoresDayBounds(new Date(`${date}T12:00:00Z`));
    assert.equal(bounds.dateKey, date);
    assert.equal((bounds.end.getTime() - bounds.start.getTime()) / 3600000, hours);
  }
  for (const range of ranges) {
    const data = await getStatisticsData(range);
    // Filter by the local date string independently of the SQL UTC-boundary implementation.
    const lines = movements.filter((line) => { const date = getAzoresDateKey(line.createdAt); return date >= range.from && date <= range.to; });
    const groups = new Map<string, typeof lines>();
    for (const line of lines) { const id = line.saleGroupId ?? line.id; groups.set(id, [...(groups.get(id) ?? []), line]); }
    const paid = [...groups.values()].filter((group) => !group.some((line) => line.saleStatus === "PENDING") && group.some((line) => !line.saleStatus || line.saleStatus === "PAID"));
    const paidLines = paid.flat().filter((line) => !line.saleStatus || line.saleStatus === "PAID");
    const amount = (rows: typeof lines) => rows.reduce((sum, line) => sum + line.quantity * (line.saleUnitPriceInCents ?? 0), 0);
    const paidValue = amount(paidLines);
    assert.equal(data.sales.paidValue, paidValue);
    assert.equal(data.sales.paidCount, paid.length);
    assert.equal(data.sales.pendingValue, amount(lines.filter((line) => line.saleStatus === "PENDING")));
    assert.equal(data.sales.ticketAverage, paid.length ? Math.round(paidValue / paid.length) : 0);
    const bottles = paidLines.filter((line) => line.reason === "SALE").reduce((sum, line) => sum + line.quantity, 0);
    assert.equal(data.sales.bottles, bottles);
    for (const key of ["sold", "brands", "audiences"] as const) assert.equal(data.allRankings[key].reduce((sum, row) => sum + row.value, 0), bottles);
    assert.equal(data.series.reduce((sum, row) => sum + (row.revenue ?? 0), 0), paidValue);
    assert.equal(data.series.reduce((sum, row) => sum + (row.sales ?? 0), 0), paid.length);
    const individual = paidLines.filter((line) => line.reason === "DECANT" && !/kit de decants/i.test(line.notes ?? ""));
    const five = individual.filter((line) => /decant individual/i.test(line.notes ?? "") && /5\s*ml/i.test(line.notes ?? "") && !/10\s*ml/i.test(line.notes ?? "")).reduce((sum, line) => sum + line.quantity, 0);
    const ten = individual.filter((line) => /10\s*ml/i.test(line.notes ?? "")).reduce((sum, line) => sum + line.quantity, 0);
    const kits = new Map<string, number>();
    for (const line of paidLines.filter((line) => line.reason === "DECANT" && /kit de decants/i.test(line.notes ?? ""))) { const id = line.saleGroupId ?? line.id; kits.set(id, Math.max(kits.get(id) ?? 0, line.quantity)); }
    assert.equal(data.sales.fiveMl, five);
    assert.equal(data.sales.tenMl, ten);
    assert.equal(data.sales.decantKits, [...kits.values()].reduce((sum, value) => sum + value, 0));
    const daily = await prisma.analyticsDaily.findMany({ where: { dateKey: { gte: range.from, lte: range.to } } });
    assert.equal(data.totals.visits, daily.reduce((sum, row) => sum + row.visits, 0));
    assert.equal(data.totals.checkout, daily.reduce((sum, row) => sum + row.checkoutWhatsapp, 0));
    const previous = previousStatisticsRange(range);
    const days = (r: { from: string; to: string }) => (Date.parse(r.to) - Date.parse(r.from)) / 86400000;
    assert.equal(days(previous), days(range));
    assert.ok(previous.to < range.from);
    console.log(JSON.stringify({ period: range.period, from: range.from, to: range.to, paidSales: data.sales.paidCount, receivedCents: data.sales.paidValue, pendingCents: data.sales.pendingValue, bottles, fiveMl: five, tenMl: ten, kits: data.sales.decantKits, result: "PASS" }));
  }
}
verify().finally(() => prisma.$disconnect()).catch((error) => { console.error(error instanceof Error ? error.message : "Verification failed"); process.exitCode = 1; });
