import type { Metadata, Viewport } from "next";
import { AdminPwa } from "@/components/admin/admin-pwa";
import "./mobile.css";
import { buildPageMetadata } from "@/lib/seo";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminAccess } from "@/components/admin/admin-access";

export const metadata: Metadata = { ...buildPageMetadata({
  title: "Admin",
  description: "Área de administração da Perfumaria 9 Ilhas.",
  path: "/admin",
  noIndex: true,
}), manifest: "/admin/manifest.webmanifest", applicationName: "9 Ilhas Admin", appleWebApp: { capable: true, title: "9 Ilhas Admin", statusBarStyle: "black-translucent" }, icons: { apple: "/admin-pwa/apple-touch-icon.png" } };

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#151515" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  return <AdminAccess value={admin ? { name: admin.name, role: admin.role } : null}><AdminPwa />{children}</AdminAccess>;
}
