import { getSaleAccounts, type SaleAccountView } from "./sale-accounts";

export function summarizeSalesFinance(sales: SaleAccountView[], from: Date, to: Date) {
  const inPeriod = (value: string) => new Date(value) >= from && new Date(value) < to;
  const cohort = sales.filter(s => inPeriod(s.createdAt));
  const receipts = sales.flatMap(s => s.history.filter(e => (e.kind === "PAYMENT" || e.kind === "REVERSAL") && inPeriod(e.occurredAt)).map(e => ({ ...e, saleId: s.id })));
  const soldValue = cohort.reduce((n, s) => n + s.total, 0);
  return {
    soldValue, saleCount: cohort.length,
    receivedValue: receipts.reduce((n, e) => n + e.amount, 0),
    legacyPaidValue: cohort.reduce((n, s) => n + s.openingReceived, 0),
    pendingValue: cohort.reduce((n, s) => n + s.outstanding, 0),
    paidCount: cohort.filter(s => s.total > 0 && s.outstanding === 0).length,
    ticketAverage: cohort.length ? Math.round(soldValue / cohort.length) : 0,
    receipts,
  };
}
export async function getSalesFinance(from: Date, to: Date) {
  return summarizeSalesFinance(await getSaleAccounts(), from, to);
}
