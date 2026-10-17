import { createHash, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient, type SaleAccountEvent } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";

const include = { product: { select: { name: true, imageUrl: true } } };
type Line = Prisma.StockMovementGetPayload<{ include: typeof include }>;
type Opening = Record<string, { paid: number; delivered: number }>;
type Account = { version: number; opening: Prisma.JsonValue; events: SaleAccountEvent[] };
export class SaleConflict extends Error {}
const money = (line: Line) => line.saleStatus === "OFFERED" ? 0 : line.quantity * (line.saleUnitPriceInCents ?? 0);
function openingFor(lines: Line[]): Opening {
  return Object.fromEntries(lines.map(line => [line.id, {
    paid: line.saleStatus === "PENDING" ? 0 : money(line),
    delivered: line.deliveryStatus === "PENDING" ? 0 : line.quantity,
  }]));
}
export function saleAccountVersion(lines: Line[], account?: Pick<Account, "version"> | null) {
  return createHash("sha256").update(JSON.stringify([account?.version ?? 0, lines.map(l => [l.id, l.updatedAt.toISOString()]).sort()])).digest("hex");
}
export function accountView(lines: Line[], account?: Account | null, legacyHistory: {notes: string | null; createdAt: Date}[] = []) {
  const opening = account ? account.opening as Opening : openingFor(lines);
  const events = account?.events ?? [];
  const items = lines.map(line => {
    const base = opening[line.id];
    if (!base) throw new SaleConflict("Os artigos da venda foram alterados. É necessária revisão.");
    const allocated = events.filter(e => e.movementId === line.id && e.kind !== "DELIVERY").reduce((n, e) => n + e.amount, 0);
    const delivery = events.filter(e => e.kind === "DELIVERY" && e.movementId === line.id).at(-1);
    const delivered = delivery?.delivered ?? base.delivered;
    return { id: line.id, productId: line.productId, name: line.product.name, imageUrl: line.product.imageUrl,
      quantity: line.quantity, total: money(line), received: base.paid + allocated,
      outstanding: Math.max(0, money(line) - base.paid - allocated), delivered,
      undelivered: line.quantity - delivered, notes: line.notes, offered: line.saleStatus === "OFFERED" };
  });
  const total = items.reduce((n, i) => n + i.total, 0);
  const originalOpeningReceived = Object.values(opening).reduce((n, i) => n + i.paid, 0);
  const openingReceived = originalOpeningReceived + events.filter(e => e.kind === "OPENING_CORRECTION").reduce((n, e) => n + e.amount, 0);
  const received = originalOpeningReceived + events.reduce((n, e) => n + e.amount, 0);
  return { id: lines[0].saleGroupId ?? lines[0].id, customerName: lines[0].customerName ?? "Sem nome",
    createdAt: lines[0].createdAt.toISOString(), version: saleAccountVersion(lines, account), total, received,
    outstanding: Math.max(0, total - received), openingReceived,
    unallocated: events.filter(e => !e.movementId).reduce((n, e) => n + e.amount, 0),
    undelivered: items.reduce((n, i) => n + i.undelivered, 0), items,
    legacyHistory: legacyHistory.map(e=>({notes:e.notes,date:e.createdAt.toISOString()})),
    history: events.map(e => ({ id: e.id, kind: e.kind, amount: e.amount, movementId: e.movementId,
      delivered: e.delivered, method: e.method, reason: e.reason, actorName: e.actorName,
      occurredAt: e.occurredAt.toISOString(), recordedAt: e.createdAt.toISOString(), reversesId: e.reversesId })),
  };
}
export type SaleAccountView = ReturnType<typeof accountView>;

// Only for a newly created sale whose payment was explicitly confirmed now.
// Existing sales are NEVER passed here and are not backfilled.
export async function recordInitialSalePayment(tx: Prisma.TransactionClient, saleId: string, actor: { id: string; kind: string; name: string }) {
  const lines = await tx.stockMovement.findMany({ where: { type: "SALE", OR: [{ saleGroupId: saleId }, { id: saleId }] }, include });
  if (!lines.length) return;
  const paid = lines.filter(l => l.saleStatus !== "PENDING" && money(l) > 0);
  if (!paid.length) return;
  const opening = openingFor(lines);
  for (const line of paid) opening[line.id].paid = 0;
  await tx.saleAccount.create({ data: { id: saleId, opening, version: 1, items: { create: lines.map(l => ({movementId:l.id})) } } });
  for (const line of paid) await tx.saleAccountEvent.create({ data: {
    accountId: saleId, requestId: randomUUID(), kind: "PAYMENT", amount: money(line), movementId: line.id,
    actorId: `${actor.kind}:${actor.id}`, actorName: actor.name, occurredAt: new Date(),
    reason: "Pagamento confirmado no registo da venda; método não indicado.",
  } });
}

export async function getSaleAccounts(db = prisma) {
  // One consistent snapshot for balances, delivery states and ledger versions.
  return db.$transaction(async tx => {
    const lines = await tx.stockMovement.findMany({ where: { type: "SALE", customerName: { not: null } }, include, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    const accounts = await tx.saleAccount.findMany({ include: { events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } } });
    const legacyAudit = await tx.stockMovement.findMany({where:{type:"ADJUSTMENT",notes:{startsWith:"Estado da venda "}},select:{notes:true,createdAt:true},orderBy:{createdAt:"asc"}});
    const byId = new Map(accounts.map(a => [a.id, a]));
    const groups = new Map<string, Line[]>();
    for (const line of lines) { const id = line.saleGroupId ?? line.id; groups.set(id, [...(groups.get(id) ?? []), line]); }
    return [...groups.values()].map(group => accountView(group, byId.get(group[0].saleGroupId ?? group[0].id), legacyAudit.filter(e=>e.notes?.startsWith(`Estado da venda ${group[0].saleGroupId ?? group[0].id} \u00b7`))));
  }, { isolationLevel: "RepeatableRead", maxWait: 10000, timeout: 30000 });
}

export const saleAccountCommand = z.object({
  saleId: z.string().min(1).max(150), version: z.string().length(64), requestId: z.uuid(),
  kind: z.enum(["PAYMENT", "REVERSAL", "DELIVERY", "OPENING_CORRECTION"]),
  amount: z.number().int().min(-100_000_000).max(100_000_000).optional(),
  movementId: z.string().min(1).optional(), delivered: z.number().int().nonnegative().optional(),
  method: z.enum(["CASH", "MBWAY", "TRANSFER", "CARD"]).optional(),
  occurredAt: z.iso.datetime().optional(), reversesId: z.string().optional(), reason: z.string().trim().min(3).max(500).optional(),
});
type Command = z.infer<typeof saleAccountCommand>;

export async function changeSaleAccount(db: Pick<PrismaClient, "$transaction">, command: Command, actor: { id: string; name: string; kind: string }) {
  return db.$transaction(async tx => {
    // Same lock is also taken by the original sale editing/deletion endpoints.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${command.saleId}, 0))`;
    const prior = await tx.saleAccountEvent.findUnique({ where: { requestId: command.requestId } });
    if (prior) {
      const matches = prior.accountId === command.saleId && prior.kind === command.kind && prior.actorId === `${actor.kind}:${actor.id}` &&
        (command.kind === "REVERSAL" || (prior.movementId ?? undefined) === command.movementId) && (prior.reversesId ?? undefined) === command.reversesId &&
        (command.kind !== "PAYMENT" || prior.amount === command.amount && prior.method === command.method) &&
        (command.kind !== "OPENING_CORRECTION" || prior.amount === command.amount) &&
        (command.kind !== "DELIVERY" || prior.delivered === command.delivered) &&
        (prior.reason ?? undefined) === command.reason && (!command.occurredAt || prior.occurredAt.toISOString() === command.occurredAt);
      if (!matches) throw new SaleConflict("O identificador já foi utilizado para outra operação.");
      return { alreadyRecorded: true };
    }
    const lines = await tx.stockMovement.findMany({ where: { type: "SALE", OR: [{ saleGroupId: command.saleId }, { id: command.saleId }] }, include, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    if (!lines.length || (lines[0].saleGroupId ?? lines[0].id) !== command.saleId) throw new Error("Venda não encontrada.");
    let account = await tx.saleAccount.findUnique({ where: { id: command.saleId }, include: { events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } } });
    const view = accountView(lines, account);
    if (view.version !== command.version) throw new SaleConflict("Outro administrador atualizou esta venda. Atualize os dados antes de confirmar novamente.");
    const item = view.items.find(i => i.id === command.movementId);
    if (command.movementId && !item) throw new Error("O produto não pertence a esta venda.");
    let amount = 0;
    let method: string | undefined;
    let movementId = command.movementId;
    const occurredAt = command.occurredAt ? new Date(command.occurredAt) : new Date();
    if (occurredAt > new Date() || occurredAt < lines[0].createdAt) throw new Error("A data deve estar entre a venda e o momento atual.");
    if (command.kind === "PAYMENT") {
      if (!command.amount || command.amount < 0 || !command.method) throw new Error("Indique um valor positivo e o método de pagamento.");
      if (command.amount > view.outstanding || item && command.amount > item.outstanding) throw new Error("O valor excede o saldo por receber.");
      amount = command.amount; method = command.method;
    } else if (command.kind === "REVERSAL") {
      const original = account?.events.find(e => e.id === command.reversesId && e.kind === "PAYMENT");
      if (!original || account?.events.some(e => e.reversesId === original.id)) throw new Error("Pagamento inexistente ou já anulado.");
      if (!command.reason) throw new Error("Indique o motivo da anulação/correção.");
      if (occurredAt < original.occurredAt) throw new Error("A anulação não pode anteceder o pagamento.");
      amount = -original.amount; movementId = original.movementId ?? undefined; method = original.method ?? undefined;
    } else if (command.kind === "OPENING_CORRECTION") {
      if (!item || !command.reason || !command.amount) throw new Error("Indique o artigo, valor da correção e motivo.");
      const opening = account ? account.opening as Opening : openingFor(lines);
      const legacy = opening[item.id].paid + (account?.events ?? []).filter(e => e.kind === "OPENING_CORRECTION" && e.movementId === item.id).reduce((n,e) => n+e.amount,0);
      if (legacy + command.amount < 0 || legacy + command.amount > item.total || item.received + command.amount < 0 || item.received + command.amount > item.total || view.received + command.amount > view.total) throw new Error("A correção excede o saldo anterior ou o valor do artigo.");
      amount = command.amount;
    } else {
      if (!item || command.delivered === undefined || command.delivered > item.quantity) throw new Error("Quantidade entregue inválida.");
      if (item.delivered === command.delivered) throw new Error("A quantidade entregue não mudou.");
      if (command.delivered < item.delivered && !command.reason) throw new Error("Indique o motivo da correção da entrega.");
    }
    if (!account) account = await tx.saleAccount.create({ data: { id: command.saleId, opening: openingFor(lines), items: { create: lines.map(l => ({movementId:l.id})) } }, include: { events: true } });
    await tx.saleAccountEvent.create({ data: { accountId: command.saleId, requestId: command.requestId,
      kind: command.kind, amount, method, movementId, delivered: command.kind === "DELIVERY" ? command.delivered : undefined,
      reversesId: command.kind === "REVERSAL" ? command.reversesId : undefined, reason: command.reason,
      actorId: `${actor.kind}:${actor.id}`, actorName: actor.name, occurredAt } });
    await tx.saleAccount.update({ where: { id: command.saleId }, data: { version: { increment: 1 } } });
    return { alreadyRecorded: false };
  }, { maxWait: 10000, timeout: 30000 });
}
