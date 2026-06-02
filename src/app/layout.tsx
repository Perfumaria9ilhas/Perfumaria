import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/providers/cart-provider";
import { getStoreSettings } from "@/lib/store-settings";
import "./globals.css";

const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "9 Ilhas Perfumaria",
  description:
    "Catálogo online de perfumes árabes, cosméticos e ambientadores com alma açoriana.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getStoreSettings();

  return (
    <html lang="pt-PT" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <CartProvider whatsappNumber={settings.whatsappNumber}>{children}</CartProvider>
      </body>
    </html>
  );
}
