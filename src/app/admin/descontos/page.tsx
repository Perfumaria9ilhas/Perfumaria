import { requireAdmin } from "@/lib/auth";
import { listPromotions } from "@/lib/promotion-management";
import { AdminShell } from "@/components/admin/admin-shell";
import { PromotionManager } from "@/components/admin/promotion-manager";
import "../promotions.css";
export const dynamic = "force-dynamic";
export default async function DiscountsPage() {
  await requireAdmin();
  return <AdminShell title="Descontos e promoções" description="Escolha e controle os descontos da loja toda ou de produtos específicos."><PromotionManager initial={await listPromotions()} /></AdminShell>;
}
