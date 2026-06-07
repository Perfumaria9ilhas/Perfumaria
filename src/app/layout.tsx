import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { CartProvider } from "@/components/providers/cart-provider";
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
  const metaPixelId = process.env.META_PIXEL_ID;

  return (
    <html lang="pt-PT" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        {metaPixelId ? (
          <>
            <Script id="meta-pixel-base" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${metaPixelId}');
              `}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              />
            </noscript>
            <MetaPixel pixelId={metaPixelId} />
          </>
        ) : null}
        <CartProvider whatsappNumber={settings.whatsappNumber}>{children}</CartProvider>
      </body>
    </html>
  );
}
