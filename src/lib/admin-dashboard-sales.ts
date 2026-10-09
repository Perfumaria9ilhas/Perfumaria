type DashboardMovement = {

  id: string; saleGroupId: string | null; saleStatus: string | null;

  quantity: number; saleUnitPriceInCents: number | null; unitCostInCents: number | null;

  reason: string | null; notes: string | null; product: { purchaseCostInCents: number; sizeLabel: string };

};

export function summarizePaidSales(movements: DashboardMovement[]) {

  const groups = new Map<string, DashboardMovement[]>();

  for (const item of movements) { const key = item.saleGroupId ?? item.id; groups.set(key, [...(groups.get(key) ?? []), item]); }

  const paid = [...groups.values()].filter(items => !items.some(item => item.saleStatus === "PENDING") && items.some(item => (item.saleStatus ?? "PAID") === "PAID"));

  let revenue = 0, profit = 0, missingCost = 0;

  for (const item of paid.flat().filter(item => (item.saleStatus ?? "PAID") === "PAID")) {

    const value = item.quantity * (item.saleUnitPriceInCents ?? 0); revenue += value;

    let cost = item.unitCostInCents;

    if (cost === null) {

      cost = item.product.purchaseCostInCents || null;

      if (cost !== null && item.reason === "DECANT") {

        const volume = item.product.sizeLabel.match(/^(\d+(?:[.,]\d+)?)\s*ml$/i);

        const ml = item.notes?.includes("10 ml") ? 10 : 5;

        cost = volume && Number(volume[1].replace(",", ".")) > 0 ? Math.round(cost * ml / Number(volume[1].replace(",", "."))) : null;

      }

    }

    if (cost === null || cost <= 0) missingCost += item.quantity;

    else profit += value - cost * item.quantity;

  }

  return { paidSales: paid.length, paidValue: revenue, estimatedProfit: profit, missingCost };

}
