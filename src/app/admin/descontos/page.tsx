import { requireAdmin } from "@/lib/auth";
import { listPromotions } from "@/lib/promotion-management";
import { AdminShell } from "@/components/admin/admin-shell";
import { PromotionManager } from "@/components/admin/promotion-manager";
import "../promotions.css";
export const dynamic = "force-dynamic";
export default async function DiscountsPage() {
  await requireAdmin();
  return <AdminShell title="Descontos e promoções" description="Gerir preços especiais dos frascos, independentemente do Perfume do Dia."><PromotionManager initial={await listPromotions()} /></AdminShell>;
}
