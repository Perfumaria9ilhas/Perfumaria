import { Montserrat, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/providers/cart-provider";
import { buildRootMetadata, buildStoreJsonLd, safeJsonLd } from "@/lib/seo";
import { getStoreSettings } from "@/lib/store-settings";
import "./globals.css";

const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700"],
});

const bodyFont = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["500"],
});

export async function generateMetadata() {
  const settings = await getStoreSettings();
  return buildRootMetadata(settings.heroImageUrl);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getStoreSettings();
  const storeJsonLd = buildStoreJsonLd(settings);

  return (
    <html lang="pt-PT" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(storeJsonLd) }}
        />
        <CartProvider whatsappNumber={settings.whatsappNumber}>{children}</CartProvider>
      </body>
    </html>
  );
}
