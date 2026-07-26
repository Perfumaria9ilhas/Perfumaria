import { StockMovementReason, StockMovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStockMovementsForProduct } from "@/lib/stock-server";
import { parseEuroPriceToCentsForStock } from "@/lib/stock-utils";

const deleteMovementSchema = z.object({
  movementId: z.string().min(1, "Movimento invalido."),
});

const movementSchema = z
  .object({
    type: z.nativeEnum(StockMovementType),
    quantity: z.number().int().positive().optional(),
    nextStock: z.number().int().min(0).optional(),
    unitCost: z.string().optional().default(""),
    supplier: z.string().optional().default(""),
    customerName: z.string().optional().default(""),
    reason: z.nativeEnum(StockMovementReason).nullable().optional(),
    notes: z.string().optional().default(""),
    confirmOverride: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.type === StockMovementType.ADJUSTMENT) {
      if (typeof value.nextStock !== "number") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indique o stock final para um ajuste manual.",
          path: ["nextStock"],
        });
      }
      return;
    }

    if (typeof value.quantity !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indique uma quantidade valida.",
        path: ["quantity"],
      });
    }

    if (value.type === StockMovementType.SALE && !value.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Escolha o motivo da saida.",
        path: ["reason"],
      });
    }

    if (value.type === StockMovementType.SALE && value.customerName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indique o nome do cliente.",
        path: ["customerName"],
      });
    }
  });

export async function GET(
  _request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  await requireAdmin();
  const { productId } = await context.params;
  const movements = await getStockMovementsForProduct(productId);
  return NextResponse.json({ movements });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  await requireAdmin();

  const { productId } = await context.params;
  const json = await request.json();
  const parsed = movementSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados invalidos.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  let unitCostInCents: number | null = null;

  try {
    unitCostInCents = parseEuroPriceToCentsForStock(parsed.data.unitCost, true);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Custo unitario invalido.",
      },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
          priceInCents: true,
          salePriceInCents: true,
          stock: true,
          purchaseCostInCents: true,
        },
      });

      if (!product) {
        throw new Error("Produto nao encontrado.");
      }

      const previousStock = product.stock;
      let resultingStock = previousStock;
      let quantity = parsed.data.quantity ?? 0;

      if (parsed.data.type === StockMovementType.ENTRY) {
        resultingStock = previousStock + quantity;
      }

      if (parsed.data.type === StockMovementType.SALE) {
        if (quantity > previousStock && !parsed.data.confirmOverride) {
          throw new Error("A saida excede o stock disponivel.");
        }
        resultingStock = Math.max(0, previousStock - quantity);
      }

      if (parsed.data.type === StockMovementType.ADJUSTMENT) {
        resultingStock = parsed.data.nextStock ?? previousStock;
        quantity = Math.abs(resultingStock - previousStock);
      }

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: resultingStock,
          purchaseCostInCents:
            parsed.data.type === StockMovementType.ENTRY && unitCostInCents !== null
              ? unitCostInCents
              : product.purchaseCostInCents,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          type: parsed.data.type,
          reason:
            parsed.data.type === StockMovementType.ADJUSTMENT
              ? StockMovementReason.MANUAL
              : parsed.data.reason ?? null,
          quantity,
          previousStock,
          resultingStock,
          unitCostInCents,
          customerName:
            parsed.data.type === StockMovementType.SALE
              ? parsed.data.customerName.trim()
              : null,
          saleUnitPriceInCents:
            parsed.data.type === StockMovementType.SALE
              ? product.salePriceInCents ?? product.priceInCents
              : null,
          supplier: parsed.data.supplier.trim() || null,
          notes: parsed.data.notes.trim() || null,
        },
      });
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nao foi possivel registar o movimento.",
      },
      { status: 400 },
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/stock");

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  await requireAdmin();

  const { productId } = await context.params;
  const json = await request.json();
  const parsed = deleteMovementSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados invalidos.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const updatedRow = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.findFirst({
        where: {
          id: parsed.data.movementId,
          productId,
        },
      });

      if (!movement) {
        throw new Error("Movimento nao encontrado.");
      }

      const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
          stock: true,
          updatedAt: true,
        },
      });

      if (!product) {
        throw new Error("Produto nao encontrado.");
      }

      const stockDelta =
        movement.type === StockMovementType.ENTRY
          ? movement.quantity
          : movement.type === StockMovementType.SALE
            ? -movement.quantity
            : movement.resultingStock - movement.previousStock;
      const nextStock = product.stock - stockDelta;

      if (nextStock < 0) {
        throw new Error("Nao e possivel apagar este movimento porque o stock ficaria negativo.");
      }

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: nextStock,
        },
        select: {
          stock: true,
          updatedAt: true,
        },
      });

      await tx.stockMovement.delete({
        where: {
          id: movement.id,
        },
      });

      const [movementGroups, remainingCustomers, latestMovement, latestSupplierMovement] = await Promise.all([
        tx.stockMovement.groupBy({
          by: ["type"],
          where: {
            productId,
          },
          _sum: {
            quantity: true,
          },
        }),
        tx.stockMovement.findMany({
          where: {
            productId,
            type: StockMovementType.SALE,
            customerName: {
              not: null,
            },
          },
          distinct: ["customerName"],
          select: {
            customerName: true,
          },
          orderBy: {
            customerName: "asc",
          },
        }),
        tx.stockMovement.findFirst({
          where: { productId },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            createdAt: true,
          },
        }),
        tx.stockMovement.findFirst({
          where: {
            productId,
            supplier: {
              not: null,
            },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            supplier: true,
          },
        }),
      ]);

      const entries =
        movementGroups.find((entry) => entry.type === StockMovementType.ENTRY)?._sum.quantity ?? 0;
      const outputs =
        movementGroups.find((entry) => entry.type === StockMovementType.SALE)?._sum.quantity ?? 0;

      return {
        stock: updatedProduct.stock,
        entries,
        outputs,
        customerNames: remainingCustomers
          .map((entry) => entry.customerName?.trim() ?? "")
          .filter(Boolean),
        supplierName: latestSupplierMovement?.supplier?.trim() ?? null,
        lastUpdatedAt: (latestMovement?.createdAt ?? updatedProduct.updatedAt).toISOString(),
      };
    });

    revalidatePath("/admin");
    revalidatePath("/admin/stock");

    return NextResponse.json({ success: true, updatedRow });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nao foi possivel apagar o movimento.",
      },
      { status: 400 },
    );
  }
}
