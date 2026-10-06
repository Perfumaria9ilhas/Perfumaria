import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { HomepageEditor } from "@/components/admin/homepage-editor";
import { requireAdmin } from "@/lib/auth";
import { getCatalogData } from "@/lib/data";
import { getStoreSettings } from "@/lib/store-settings";
import { getStoreCollections } from "@/lib/store-collections";
import { resolveHomepageConfig } from "@/lib/homepage-config";
export default async function HomepageAdmin() {
  await requireAdmin();
  const [settings, catalog] = await Promise.all([getStoreSettings(), getCatalogData()]);
  return <AdminShell title="Página inicial" description="Imagens, textos e secções da loja, num único lugar.">
    <HomepageEditor key={settings.updatedAt!.toISOString()} initial={resolveHomepageConfig(settings,getStoreCollections(catalog.products))} version={settings.updatedAt!.toISOString()} images={catalog.products.map(p=>({id:p.id,name:p.name,imageUrl:p.imageUrl}))}/>
    <Link className="mt-5 inline-block text-sm underline" href="/admin/loja/definicoes">Restantes definições da loja e redes sociais</Link>
  </AdminShell>;
}
