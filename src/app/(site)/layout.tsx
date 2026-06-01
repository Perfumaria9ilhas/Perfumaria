import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentCustomer } from "@/lib/auth";
import { getSocialLinks, getStoreSettings } from "@/lib/store-settings";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, socialLinks, currentCustomer] = await Promise.all([
    getStoreSettings(),
    getSocialLinks(),
    getCurrentCustomer(),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader
        settings={settings}
        socialLinks={socialLinks}
        currentCustomer={currentCustomer}
      />
      <main>{children}</main>
      <SiteFooter settings={settings} socialLinks={socialLinks} />
      <FloatingWhatsApp />
    </div>
  );
}
