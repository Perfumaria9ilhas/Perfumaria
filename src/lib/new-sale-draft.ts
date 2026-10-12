import { z } from "zod";
const line = z.object({ id: z.string(), productId: z.string(), query: z.string().default(""), quantity: z.string(), sizeMl: z.union([z.literal(5), z.literal(10)]).default(5) });
export const saleDraftSchema = z.object({
  version: z.literal(1), requestId: z.string().uuid(), customerName: z.string(), status: z.enum(["PAID", "PENDING", "OFFERED"]), deliveryStatus: z.enum(["DELIVERED", "PENDING"]),
  saleOrigin: z.enum(["", "WhatsApp", "Instagram", "Facebook", "Site", "Feira", "Presencial", "Google", "Outro"]),
  perfumeLines: z.array(line).max(50), decantLines: z.array(line).max(50),
  kits: z.array(z.object({ id: z.string().uuid(), productIds: z.array(z.string()).length(5), queries: z.array(z.string()).length(5), expanded: z.boolean() })).max(100),
  prices: z.record(z.string(), z.number().int().nonnegative()), panel: z.enum(["NONE", "KIT", "INDIVIDUAL"]),
});
export type SaleDraft = z.infer<typeof saleDraftSchema>;
export function emptySaleDraft(customerName = ""): SaleDraft {
  return { version: 1, requestId: crypto.randomUUID(), customerName, status: "PAID", deliveryStatus: "DELIVERED", saleOrigin: "", perfumeLines: [{ id: "bottle-0", productId: "", query: "", quantity: "1", sizeMl: 5 }], decantLines: [], kits: [], prices: {}, panel: "NONE" };
}
export function kitMovementKey(item: { saleGroupId: string | null; id: string; notes: string | null }) {
  const kitId = item.notes?.match(/\[kit:([^\]]+)\]/)?.[1];
  return `${item.saleGroupId ?? item.id}${kitId ? `:${kitId}` : ""}`;
}
