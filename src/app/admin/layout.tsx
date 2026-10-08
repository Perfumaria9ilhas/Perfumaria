import type { Metadata, Viewport } from "next";
import { AdminPwa } from "@/components/admin/admin-pwa";
import "./mobile.css";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...buildPageMetadata({
  title: "Admin",
  description: "Área de administração da Perfumaria 9 Ilhas.",
  path: "/admin",
  noIndex: true,
}), manifest: "/admin/manifest.webmanifest", applicationName: "9 Ilhas Admin", appleWebApp: { capable: true, title: "9 Ilhas Admin", statusBarStyle: "black-translucent" }, icons: { apple: "/admin-pwa/apple-touch-icon.png" } };

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#151515" };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <><AdminPwa />{children}</>;
}
