import assert from "node:assert/strict";
import { summarizePaidSales } from "../src/lib/admin-dashboard-sales";
import { getAzoresDateKey, getAzoresDayBounds } from "../src/lib/date";
const sale = { id: "a", saleGroupId: "group", saleStatus: "PAID", quantity: 2, saleUnitPriceInCents: 4500, unitCostInCents: 2000, reason: "SALE", notes: null, product: { purchaseCostInCents: 3000, sizeLabel: "100 ml" } };
assert.deepEqual(summarizePaidSales([sale]), {paidSales:1,paidValue:9000,estimatedProfit:5000,missingCost:0});
assert.equal(summarizePaidSales([sale,{...sale,id:"b",saleStatus:"PENDING"}]).paidSales,0);
assert.equal(summarizePaidSales([{...sale,saleStatus:"OFFERED"}]).paidValue,0);
assert.equal(summarizePaidSales([{...sale,unitCostInCents:null,product:{purchaseCostInCents:0,sizeLabel:"100 ml"}}]).missingCost,2);
const decant={...sale,quantity:1,reason:"DECANT",notes:"Decant individual · 10 ml",saleUnitPriceInCents:650,unitCostInCents:null};
assert.equal(summarizePaidSales([decant]).estimatedProfit,350);
assert.equal(summarizePaidSales([{...decant,product:{purchaseCostInCents:3000,sizeLabel:"Kit"}}]).missingCost,1);
assert.equal(getAzoresDateKey(new Date("2026-12-01T00:30:00Z")),"2026-11-30");
for(const date of ["2026-03-29T12:00:00Z","2026-10-25T12:00:00Z"]){const bounds=getAzoresDayBounds(new Date(date));assert.equal(getAzoresDateKey(bounds.start),bounds.dateKey);assert.notEqual(getAzoresDateKey(bounds.end),bounds.dateKey);}
console.log("PASS paid groups, offered/pending, recorded costs, missing costs, decant cost allocation and Azores month/DST boundaries.");
