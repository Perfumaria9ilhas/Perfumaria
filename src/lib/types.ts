import type {
  Brand,
  Category,
  HeroSlide,
  OutOfStockWish,
  Product,
  StoreSettings,
} from "@prisma/client";

export type CatalogProduct = Product & {
  brand: Brand;
  category: Category;
};

export type CartLine = {
  id: string;
  name: string;
  brand: string;
  priceInCents: number;
  originalPriceInCents?: number | null;
  imageUrl: string;
  stock: number;
  quantity: number;
};

export type SiteOrderWithItems = {
  id: string;
  reference: string;
  source: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  totalInCents: number;
  whatsappMessage: string;
  createdAt: Date;
  items: {
    id: string;
    productName: string;
    brandName: string;
    unitPriceInCents: number;
    quantity: number;
    lineTotalInCents: number;
  }[];
};

export type ProductWishWithProduct = OutOfStockWish & {
  product: Product & {
    brand: Brand;
  };
};

export type PublicStoreSettings = StoreSettings & {
  heroSlides: HeroSlide[];
};
