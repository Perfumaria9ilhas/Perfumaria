import { z } from "zod";
import type { StoreCollection } from "@/lib/store-collections";

export const safeDestination = z.string().max(1000).refine((value) => {
  if (!value) return true;
  if (/^\/(?!\/)/.test(value) && !/[\\\s]/.test(value)) return true;
  try {const url=new URL(value);return ["http:","https:"].includes(url.protocol)&&!url.username&&!url.password&&!/[\\\s]/.test(value);} catch {return false;}
}, "Use um caminho do site ou um endereço http/https.");
const text = z.string().max(1500);
const image = safeDestination;
const section = { active: z.boolean(), order: z.number().int().min(0).max(1000) };
const content = { title: text, text, imageUrl: image, buttonLabel: text, href: safeDestination };
const benefit = z.object({ title: text, text });
export const homepageEditorSchema = z.object({
  hero: z.object({ ...section, ...content, eyebrow: text, benefitsActive: z.boolean(), benefits: z.array(benefit).max(3) }),
  collections: z.object({ ...section, items: z.array(z.object({ key: z.string().min(1).max(100), title: text, imageUrl: image, href: safeDestination, active: z.boolean(), order: z.number().int().min(0).max(1000) })).max(30) }),
  featured: z.object({ ...section, title: text, text, buttonLabel: text, href: safeDestination, visibleCount: z.number().int().min(1).max(6) }),
  daily: z.object({ ...section, title: text }),
  promos: z.object({ ...section, items: z.array(z.object({ ...content, key: z.string().min(1).max(100), active: z.boolean(), order: z.number().int().min(0).max(1000) })).max(12) }),
  trust: z.object({ ...section, items: z.array(benefit).max(4) }),
  seo: z.object({ ...section, title: text, text, buttonLabel: text, href: safeDestination }),
  reviews: z.object({ ...section, title: text, eyebrow: text }),
}).strict();
export type HomepageEditorConfig = z.infer<typeof homepageEditorSchema>;
export type HomepageSection = keyof HomepageEditorConfig;
export const homepageSectionLabels: Record<HomepageSection, string> = { hero: "Imagem principal", collections: "Categorias redondas", featured: "Preferidos dos Nossos Clientes", daily: "Perfume do Dia", promos: "Decants / Pasta Corporal / Ambientadores", trust: "Benefícios", seo: "Informação institucional / SEO", reviews: "Testemunhos" };

type Settings = { heroTitle: string; heroDescription: string; heroPrimaryButtonLabel: string; heroImageUrl?: string | null; decantsImageUrl?: string | null; homeFeaturedTitle: string; homeFeaturedDescription: string; homeFeaturedButtonLabel: string; homeTestimonialsTitle: string; homeTestimonialsEyebrow: string; homepageConfig?: unknown };
export function readHomepageState(value: unknown): { editor?: HomepageEditorConfig; perfumeOfDayId: string | null } {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const parsed = homepageEditorSchema.safeParse(root.editor);
  return { editor: parsed.success ? parsed.data : undefined, perfumeOfDayId: typeof root.perfumeOfDayId === "string" ? root.perfumeOfDayId : null };
}
export function resolveHomepageConfig(settings: Settings, collections: StoreCollection[]): HomepageEditorConfig {
  const saved = readHomepageState(settings.homepageConfig).editor;
  if (saved) return saved;
  const promos = collections.filter((c) => c.kind === "decants" || /ambient|pasta|corpo/i.test(c.slug)).slice(0, 3);
  return {
    hero: { active: true, order: 0, eyebrow: "Bem-vindo à 9 Ilhas", title: settings.heroTitle, text: settings.heroDescription, imageUrl: settings.heroImageUrl ?? "", buttonLabel: settings.heroPrimaryButtonLabel, href: "/catalogo", benefitsActive: true, benefits: [{title:"Entrega em mão",text:"Ilha Terceira"},{title:"Envios CTT",text:"Açores, Madeira e Continente"},{title:"Pagamento",text:"MBWay ou transferência"}] },
    collections: { active: true, order: 10, items: collections.map((c, index) => ({key:c.key,title:c.label,imageUrl:c.imageUrl,href:c.href,active:true,order:index})) },
    featured: { active: true, order: 20, title: settings.homeFeaturedTitle, text: settings.homeFeaturedDescription, buttonLabel: settings.homeFeaturedButtonLabel, href: "/catalogo", visibleCount: 5 },
    daily: { active: true, order: 25, title: "Perfume do Dia" },
    promos: { active: true, order: 30, items: promos.map((c,index) => ({key:c.key,title:c.label,text:c.kind === "decants" ? "Experimente novos aromas antes de escolher." : /ambient/i.test(c.slug) ? "Aroma para a sua casa." : "Descubra a nossa seleção para o corpo.",imageUrl:c.kind === "decants" && settings.decantsImageUrl ? settings.decantsImageUrl : c.imageUrl,buttonLabel:"Explorar",href:c.href,active:true,order:index})) },
    trust: { active: true, order: 40, items: [{title:"Produtos originais",text:"Marcas de confiança"},{title:"Decants 5 ml e 10 ml",text:"Em perfumes selecionados"},{title:"Entregas na Ilha Terceira",text:"Envios para todo o país"},{title:"Apoio próximo",text:"Fale connosco por WhatsApp"}] },
    seo: { active: true, order: 50, title:"Perfumes árabes originais na Ilha Terceira",text:"A Perfumaria 9 Ilhas, na Praia da Vitória, ajuda clientes da Ilha Terceira e de todo o arquipélago dos Açores a encontrar fragrâncias árabes originais com apoio próximo por WhatsApp, entrega local e envios para Madeira e Portugal Continental.",buttonLabel:"Saber mais",href:"/perfumes-arabes-acores" },
    reviews: { active: true, order: 60, title: settings.homeTestimonialsTitle, eyebrow: settings.homeTestimonialsEyebrow },
  };
}
