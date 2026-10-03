import { StockMovementReason, StockMovementType, StockSaleStatus } from "@prisma/client";
import { getAzoresDateKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export type StatisticsPeriod = "today" | "7d" | "30d" | "month" | "year" | "previous-year" | "custom";
export type StatisticsMetric = "visits" | "views" | "cart" | "whatsapp" | "orders" | "sales" | "revenue";
const BEHAVIOR_TRACKING_START = "2026-09-27";

function validDateKey(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : value;
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string) {
  return Math.round((new Date(`${to}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime()) / 86_400_000) + 1;
}

export function previousStatisticsRange(range: { from: string; to: string }) {
  const length = daysBetween(range.from, range.to);
  const to = addDays(range.from, -1);
  return { from: addDays(to, -(length - 1)), to };
}

function enumerateDays(from: string, to: string) {
  const values: string[] = [];
  for (let current = from; current <= to; current = addDays(current, 1)) values.push(current);
  return values;
}

function azoresMidnightUtc(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  let candidate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  for (let index = 0; index < 2; index += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Atlantic/Azores", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(candidate);
    const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    const represented = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    candidate = new Date(candidate.getTime() + (Date.UTC(year, month - 1, day) - represented));
  }
  return candidate;
}

export function resolveStatisticsRange(input: { period?: string; from?: string; to?: string }) {
  const today = getAzoresDateKey();
  const period = (["today", "7d", "30d", "month", "year", "previous-year", "custom"].includes(input.period ?? "")
    ? input.period
    : "30d") as StatisticsPeriod;
  let from = today;
  let to = today;
  if (period === "7d") from = addDays(today, -6);
  if (period === "30d") from = addDays(today, -29);
  if (period === "month") from = `${today.slice(0, 7)}-01`;
  if (period === "year") {
    from = `${today.slice(0, 4)}-01-01`;
    to = `${today.slice(0, 4)}-12-31`;
  }
  if (period === "previous-year") {
    const year = Number(today.slice(0, 4)) - 1;
    from = `${year}-01-01`;
    to = `${year}-12-31`;
  }
  if (period === "custom") {
    from = validDateKey(input.from) ?? addDays(today, -29);
    to = validDateKey(input.to) ?? today;
    if (from > to) [from, to] = [to, from];
  }
  return { period, from, to };
}

export async function getStatisticsData(range: { from: string; to: string }) {
  const createdAt = { gte: azoresMidnightUtc(range.from), lt: azoresMidnightUtc(addDays(range.to, 1)) };
  const [daily, productDaily, searches, orders, movements, firstDaily, firstProductDaily, firstSearch, firstOrder, firstSale, migratedVisitDays] = await Promise.all([
    prisma.analyticsDaily.findMany({ where: { dateKey: { gte: range.from, lte: range.to } }, orderBy: { dateKey: "asc" } }),
    prisma.productAnalyticsDaily.findMany({ where: { dateKey: { gte: range.from, lte: range.to } }, include: { product: { select: { name: true, audience: true, brand: { select: { name: true } } } } } }),
    prisma.searchAnalyticsDaily.findMany({ where: { dateKey: { gte: range.from, lte: range.to } } }),
    prisma.siteOrder.findMany({ where: { createdAt }, select: { id: true, status: true, totalInCents: true, createdAt: true } }),
    prisma.stockMovement.findMany({
      where: { type: StockMovementType.SALE, createdAt },
      select: { id: true, saleGroupId: true, saleStatus: true, saleUnitPriceInCents: true, quantity: true, createdAt: true, reason: true, notes: true, productId: true, product: { select: { name: true, audience: true, brand: { select: { name: true } } } } },
    }),
    prisma.analyticsDaily.findFirst({ orderBy: { dateKey: "asc" }, select: { dateKey: true } }),
    prisma.productAnalyticsDaily.findFirst({ orderBy: { dateKey: "asc" }, select: { dateKey: true } }),
    prisma.searchAnalyticsDaily.findFirst({ orderBy: { dateKey: "asc" }, select: { dateKey: true } }),
    prisma.siteOrder.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    prisma.stockMovement.findFirst({ where: { type: StockMovementType.SALE }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    prisma.dailySiteVisit.count(),
  ]);

  const totals = daily.reduce((sum, row) => ({
    visits: sum.visits + row.visits,
    views: sum.views + row.productViews,
    addToCartEvents: sum.addToCartEvents + row.addToCartEvents,
    addedUnits: sum.addedUnits + row.addedUnits,
    checkout: sum.checkout + row.checkoutWhatsapp,
    reservations: sum.reservations + row.reservations,
    contacts: sum.contacts + row.generalWhatsappContacts,
  }), { visits: 0, views: 0, addToCartEvents: 0, addedUnits: 0, checkout: 0, reservations: 0, contacts: 0 });

  const movementGroups = new Map<string, typeof movements>();
  for (const movement of movements) {
    const groupId = movement.saleGroupId ?? movement.id;
    movementGroups.set(groupId, [...(movementGroups.get(groupId) ?? []), movement]);
  }
  const paidGroupIds = new Set(
    [...movementGroups.entries()]
      .filter(([, items]) =>
        !items.some((item) => item.saleStatus === StockSaleStatus.PENDING) &&
        items.some((item) => (item.saleStatus ?? StockSaleStatus.PAID) === StockSaleStatus.PAID),
      )
      .map(([groupId]) => groupId),
  );
  const paidMovements = movements.filter((movement) =>
    paidGroupIds.has(movement.saleGroupId ?? movement.id) &&
    (movement.saleStatus ?? StockSaleStatus.PAID) === StockSaleStatus.PAID,
  );
  const pendingMovements = movements.filter((movement) => movement.saleStatus === StockSaleStatus.PENDING);
  const paidValue = paidMovements.reduce((sum, movement) => sum + movement.quantity * (movement.saleUnitPriceInCents ?? 0), 0);
  const pendingValue = pendingMovements.reduce((sum, movement) => sum + movement.quantity * (movement.saleUnitPriceInCents ?? 0), 0);
  const paidUnits = paidMovements.reduce((sum, movement) => sum + movement.quantity, 0);

  const aggregateProducts = (field: "views" | "addedUnits" | "checkoutUnits" | "reservationEvents") => {
    const map = new Map<string, { name: string; value: number }>();
    for (const row of productDaily) {
      const current = map.get(row.productId) ?? { name: row.product.name, value: 0 };
      current.value += row[field];
      map.set(row.productId, current);
    }
    return [...map.values()].filter((item) => item.value > 0).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "pt-PT"));
  };
  const checkoutProducts = aggregateProducts("checkoutUnits");
  const reservationProducts = aggregateProducts("reservationEvents");
  const soldProducts = new Map<string, { name: string; value: number }>();
  for (const movement of paidMovements) {
    if (movement.reason !== StockMovementReason.SALE) continue;
    const current = soldProducts.get(movement.productId) ?? { name: movement.product.name, value: 0 };
    current.value += movement.quantity;
    soldProducts.set(movement.productId, current);
  }
  const searchRanking = new Map<string, { name: string; value: number; zero: number }>();
  for (const row of searches) {
    const current = searchRanking.get(row.normalizedTerm) ?? { name: row.displayTerm, value: 0, zero: 0 };
    current.value += row.searchCount;
    current.zero += row.zeroResultCount;
    searchRanking.set(row.normalizedTerm, current);
  }

  const aggregateProductDimension = (dimension: "brand" | "audience") => {
    const values = new Map<string, number>();
    for (const movement of paidMovements) {
      if (movement.reason !== StockMovementReason.SALE) continue;
      const name = dimension === "brand" ? movement.product.brand.name : movement.product.audience === "MASCULINO" ? "Homem" : movement.product.audience === "FEMININO" ? "Mulher" : "Unissexo";
      values.set(name, (values.get(name) ?? 0) + movement.quantity);
    }
    return [...values].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "pt-PT"));
  };
  const paidBottles = paidMovements.filter((movement) => movement.reason === StockMovementReason.SALE).reduce((sum, movement) => sum + movement.quantity, 0);
  const paidFiveMl = paidMovements.filter((movement) => movement.reason === StockMovementReason.DECANT && /5\s*ml/i.test(movement.notes ?? "") && !/10\s*ml/i.test(movement.notes ?? "")).reduce((sum, movement) => sum + movement.quantity, 0);
  const paidTenMl = paidMovements.filter((movement) => movement.reason === StockMovementReason.DECANT && /10\s*ml/i.test(movement.notes ?? "")).reduce((sum, movement) => sum + movement.quantity, 0);
  const decantKitGroups = new Map<string, number>();
  for (const movement of paidMovements.filter((item) => item.reason === StockMovementReason.DECANT && /kit de decants/i.test(item.notes ?? ""))) {
    const groupId = movement.saleGroupId ?? movement.id;
    decantKitGroups.set(groupId, Math.max(decantKitGroups.get(groupId) ?? 0, movement.quantity));
  }
  const paidDecantKits = [...decantKitGroups.values()].reduce((sum, quantity) => sum + quantity, 0);

  const dayMap = new Map(daily.map((row) => [row.dateKey, row]));
  const orderDays = new Map<string, number>();
  for (const order of orders) orderDays.set(getAzoresDateKey(order.createdAt), (orderDays.get(getAzoresDateKey(order.createdAt)) ?? 0) + 1);
  const saleDays = new Map<string, Set<string>>();
  const revenueDays = new Map<string, number>();
  for (const movement of paidMovements) {
    const key = getAzoresDateKey(movement.createdAt);
    const groups = saleDays.get(key) ?? new Set<string>();
    groups.add(movement.saleGroupId ?? movement.id);
    saleDays.set(key, groups);
    revenueDays.set(key, (revenueDays.get(key) ?? 0) + movement.quantity * (movement.saleUnitPriceInCents ?? 0));
  }
  const starts = {
    visits: firstDaily?.dateKey ?? null,
    views: firstProductDaily?.dateKey ?? BEHAVIOR_TRACKING_START,
    cart: firstProductDaily?.dateKey ?? BEHAVIOR_TRACKING_START,
    whatsapp: firstDaily?.dateKey && firstDaily.dateKey > BEHAVIOR_TRACKING_START ? firstDaily.dateKey : BEHAVIOR_TRACKING_START,
    orders: firstOrder ? getAzoresDateKey(firstOrder.createdAt) : null,
    sales: firstSale ? getAzoresDateKey(firstSale.createdAt) : null,
    revenue: firstSale ? getAzoresDateKey(firstSale.createdAt) : null,
  } satisfies Record<StatisticsMetric, string | null>;
  const behaviorStarts = {
    visits: starts.visits,
    views: starts.views,
    cart: starts.cart,
    whatsapp: starts.whatsapp,
    reservations: firstDaily?.dateKey && firstDaily.dateKey > BEHAVIOR_TRACKING_START ? firstDaily.dateKey : BEHAVIOR_TRACKING_START,
    searches: firstSearch?.dateKey ?? BEHAVIOR_TRACKING_START,
  };
  const availability = Object.fromEntries(
    Object.entries(behaviorStarts).map(([metric, start]) => [metric, Boolean(start && range.to >= start)]),
  ) as Record<keyof typeof behaviorStarts, boolean>;
  const days = enumerateDays(range.from, range.to);
  const series = days.map((dateKey) => ({
    dateKey,
    visits: dateKey <= getAzoresDateKey() && starts.visits && dateKey >= starts.visits ? dayMap.get(dateKey)?.visits ?? 0 : null,
    views: dateKey <= getAzoresDateKey() && dateKey >= starts.views ? dayMap.get(dateKey)?.productViews ?? 0 : null,
    cart: dateKey <= getAzoresDateKey() && dateKey >= starts.cart ? dayMap.get(dateKey)?.addToCartEvents ?? 0 : null,
    whatsapp: dateKey <= getAzoresDateKey() && dateKey >= starts.whatsapp ? dayMap.get(dateKey)?.checkoutWhatsapp ?? 0 : null,
    orders: dateKey <= getAzoresDateKey() && starts.orders && dateKey >= starts.orders ? orderDays.get(dateKey) ?? 0 : null,
    sales: dateKey <= getAzoresDateKey() && starts.sales && dateKey >= starts.sales ? saleDays.get(dateKey)?.size ?? 0 : null,
    revenue: dateKey <= getAzoresDateKey() && starts.revenue && dateKey >= starts.revenue ? revenueDays.get(dateKey) ?? 0 : null,
  }));

  const allRankings = {
    viewed: aggregateProducts("views"),
    added: aggregateProducts("addedUnits"),
    whatsapp: checkoutProducts,
    reservations: reservationProducts,
    sold: [...soldProducts.values()].filter((item) => item.value > 0).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "pt-PT")),
    searches: [...searchRanking.values()].filter((item) => item.value > 0).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "pt-PT")),
    zeroSearches: [...searchRanking.values()].filter((item) => item.zero > 0).map((item) => ({ name: item.name, value: item.zero })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "pt-PT")),
    brands: aggregateProductDimension("brand"),
    audiences: aggregateProductDimension("audience"),
  };

  return {
    totals,
    orders: { count: orders.length, potentialValue: orders.reduce((sum, order) => sum + order.totalInCents, 0), cancelled: orders.filter((order) => order.status.toLocaleLowerCase("pt-PT") === "cancelado").length },
    sales: { paidCount: paidGroupIds.size, paidValue, pendingValue, paidUnits, ticketAverage: paidGroupIds.size ? Math.round(paidValue / paidGroupIds.size) : 0, bottles: paidBottles, fiveMl: paidFiveMl, tenMl: paidTenMl, decantKits: paidDecantKits },
    rankings: {
      viewed: allRankings.viewed.slice(0, 5),
      added: allRankings.added.slice(0, 5),
      whatsapp: allRankings.whatsapp.slice(0, 5),
      reservations: allRankings.reservations.slice(0, 5),
      sold: allRankings.sold.slice(0, 5),
      searches: allRankings.searches.slice(0, 5),
      zeroSearches: allRankings.zeroSearches.slice(0, 5),
      brands: allRankings.brands.slice(0, 5),
      audiences: allRankings.audiences.slice(0, 5),
    },
    allRankings,
    series,
    starts,
    availability,
    migratedVisitDays,
  };
}
