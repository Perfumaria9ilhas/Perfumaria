import type { Metadata } from "next";
import type { CatalogProduct, PublicStoreSettings } from "@/lib/types";
import { normalizeText } from "@/lib/text";

export const SITE_URL = "https://www.perfumaria9ilhas.pt";
export const SITE_NAME = "Perfumaria 9 Ilhas";
export const DEFAULT_OG_IMAGE = "/logo-9-ilhas.svg";
export const DEFAULT_SITE_DESCRIPTION =
  "Perfumaria da Praia da Vit\u00f3ria, Ilha Terceira, especializada em perfumes \u00e1rabes originais, com entrega local e envios para A\u00e7ores, Madeira e Portugal Continental.";

const defaultKeywords = [
  "perfumaria 9 ilhas",
  "perfumes \u00e1rabes originais",
  "perfumes \u00e1rabes a\u00e7ores",
  "perfumes \u00e1rabes ilha terceira",
  "perfumes \u00e1rabes praia da vit\u00f3ria",
  "perfumaria a\u00e7ores",
  "decants perfumes a\u00e7ores",
  "perfumes originais portugal",
];

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL).toString();
}

export function resolveSocialImage(imageUrl?: string | null) {
  if (!imageUrl) {
    return absoluteUrl(DEFAULT_OG_IMAGE);
  }

  return absoluteUrl(imageUrl);
}

type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  imageUrl?: string | null;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildRootMetadata(imageUrl?: string | null): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_SITE_DESCRIPTION,
    keywords: defaultKeywords,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "pt_PT",
      url: SITE_URL,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: DEFAULT_SITE_DESCRIPTION,
      images: [
        {
          url: resolveSocialImage(imageUrl),
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: DEFAULT_SITE_DESCRIPTION,
      images: [resolveSocialImage(imageUrl)],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
  imageUrl,
  keywords,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const normalizedTitle = normalizeText(title);
  const normalizedDescription = normalizeText(description);
  const canonical = path === "/" ? "/" : `/${path.replace(/^\/+/, "")}`;

  return {
    title: normalizedTitle,
    description: normalizedDescription,
    keywords: keywords ?? defaultKeywords,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "pt_PT",
      url: absoluteUrl(canonical),
      siteName: SITE_NAME,
      title: normalizedTitle,
      description: normalizedDescription,
      images: [
        {
          url: resolveSocialImage(imageUrl),
          width: 1200,
          height: 630,
          alt: normalizedTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: normalizedTitle,
      description: normalizedDescription,
      images: [resolveSocialImage(imageUrl)],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : undefined,
  };
}

function getStorePhone(settings: PublicStoreSettings) {
  if (settings.phone?.trim()) {
    return normalizeText(settings.phone.trim());
  }

  if (settings.whatsappNumber?.trim()) {
    return `+${settings.whatsappNumber.trim()}`;
  }

  return undefined;
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildStoreJsonLd(settings: PublicStoreSettings) {
  const phone = getStorePhone(settings);
  const email = settings.contactEmail?.trim() || "perfumaria9ilhas@hotmail.com";
  const image = resolveSocialImage(settings.heroImageUrl);
  const socialLinks = [
    settings.instagramUrl,
    settings.facebookUrl,
    settings.tiktokUrl,
  ].filter(Boolean) as string[];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: normalizeText(settings.storeName || SITE_NAME),
        url: SITE_URL,
        logo: absoluteUrl("/logo-9-ilhas.svg"),
        image,
        description: DEFAULT_SITE_DESCRIPTION,
        sameAs: socialLinks.length ? socialLinks : undefined,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: normalizeText(settings.storeName || SITE_NAME),
        inLanguage: "pt-PT",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
      },
      {
        "@type": "Store",
        "@id": `${SITE_URL}/#store`,
        name: normalizeText(settings.storeName || SITE_NAME),
        url: SITE_URL,
        image,
        description: DEFAULT_SITE_DESCRIPTION,
        email,
        telephone: phone,
        brand: {
          "@id": `${SITE_URL}/#organization`,
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Praia da Vit\u00f3ria",
          addressRegion: "A\u00e7ores",
          addressCountry: "PT",
        },
        areaServed: [
          "Ilha Terceira",
          "A\u00e7ores",
          "Madeira",
          "Portugal Continental",
        ],
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            telephone: phone,
            email,
            availableLanguage: ["pt-PT"],
          },
        ],
        sameAs: socialLinks.length ? socialLinks : undefined,
      },
    ],
  };
}

function getDisplayPriceInEuros(product: CatalogProduct) {
  const cents =
    product.salePriceInCents && product.salePriceInCents < product.priceInCents
      ? product.salePriceInCents
      : product.priceInCents;

  return Number((cents / 100).toFixed(2));
}

export function buildProductListJsonLd(
  products: CatalogProduct[],
  listName: string,
  listPath: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: normalizeText(listName),
    url: absoluteUrl(listPath),
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: normalizeText(product.name),
        sku: product.id,
        image: resolveSocialImage(product.imageUrl),
        description: normalizeText(product.description),
        brand: {
          "@type": "Brand",
          name: normalizeText(product.brand.name),
        },
        category: normalizeText(product.category.name),
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
          price: getDisplayPriceInEuros(product),
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@id": `${SITE_URL}/#store`,
          },
        },
      },
    })),
  };
}

export function buildFaqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: normalizeText(item.question),
      acceptedAnswer: {
        "@type": "Answer",
        text: normalizeText(item.answer),
      },
    })),
  };
}
