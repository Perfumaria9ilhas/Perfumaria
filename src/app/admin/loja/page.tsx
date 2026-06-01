import Image from "next/image";
import { saveStoreSettings } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/store-settings";

export default async function AdminLojaPage() {
  await requireAdmin();
  const settings = await getStoreSettings();
  const heroSlides = Array.from({ length: 4 }, (_, index) => {
    const fromSlides = settings.heroSlides[index];

    if (index === 0) {
      return {
        imageUrl: fromSlides?.imageUrl || settings.heroImageUrl || "",
        durationSeconds: fromSlides?.durationSeconds ?? 4,
      };
    }

    return {
      imageUrl: fromSlides?.imageUrl ?? "",
      durationSeconds: fromSlides?.durationSeconds ?? 4,
    };
  });

  return (
    <AdminShell
      title="Loja"
      description="Gerir contactos, redes sociais, textos e imagem principal visíveis no site."
    >
      <section className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
        <form
          action={saveStoreSettings}
          className="grid gap-4 md:grid-cols-2"
          encType="multipart/form-data"
        >
          <input
            name="storeName"
            defaultValue={settings.storeName}
            placeholder="Nome da loja"
            className="h-12 rounded-2xl border px-4"
            required
          />
          <input
            name="phone"
            defaultValue={settings.phone}
            placeholder="Telefone"
            className="h-12 rounded-2xl border px-4"
            required
          />
          <input
            name="whatsappNumber"
            defaultValue={settings.whatsappNumber}
            placeholder="WhatsApp sem espaços"
            className="h-12 rounded-2xl border px-4"
            required
          />
          <input
            name="whatsappLabel"
            defaultValue={settings.whatsappLabel}
            placeholder="Texto do WhatsApp"
            className="h-12 rounded-2xl border px-4"
            required
          />
          <input
            name="location"
            defaultValue={settings.location}
            placeholder="Localização"
            className="h-12 rounded-2xl border px-4"
            required
          />
          <input
            name="openingHours"
            defaultValue={settings.openingHours}
            placeholder="Horário"
            className="h-12 rounded-2xl border px-4"
            required
          />
          <input
            name="contactEmail"
            defaultValue={settings.contactEmail ?? ""}
            placeholder="Email"
            className="h-12 rounded-2xl border px-4"
          />
          <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
            <input
              name="instagramUrl"
              defaultValue={settings.instagramUrl ?? ""}
              placeholder="Link Instagram"
              className="h-12 rounded-2xl border px-4"
            />
            <input
              name="facebookUrl"
              defaultValue={settings.facebookUrl ?? ""}
              placeholder="Link Facebook"
              className="h-12 rounded-2xl border px-4"
            />
            <input
              name="tiktokUrl"
              defaultValue={settings.tiktokUrl ?? ""}
              placeholder="Link TikTok"
              className="h-12 rounded-2xl border px-4"
            />
          </div>

          <input
            name="heroTitle"
            defaultValue={settings.heroTitle}
            placeholder="Título principal da home"
            className="h-12 rounded-2xl border px-4 md:col-span-2"
            required
          />
          <textarea
            name="heroDescription"
            defaultValue={settings.heroDescription}
            placeholder="Texto principal da home"
            className="min-h-28 rounded-2xl border px-4 py-3 md:col-span-2"
            required
          />

          <div className="space-y-3 md:col-span-2">
            <p className="text-sm font-medium text-[color:var(--ink)]">
              Banner slider da homepage
            </p>
            <p className="text-sm text-slate-500">
              Carrega entre 1 e 4 imagens. O site vai passando uma de cada vez no topo da
              homepage.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {heroSlides.map((slide, index) => (
                <div
                  key={`hero-slide-${index + 1}`}
                  className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-4"
                >
                  <input
                    type="hidden"
                    name={`currentHeroSlide${index + 1}`}
                    value={slide.imageUrl}
                  />
                  <p className="mb-3 text-sm font-medium text-[color:var(--ink)]">
                    Slide {index + 1}
                  </p>
                  <div className="relative h-44 overflow-hidden rounded-[1.25rem] border border-[color:var(--line)] bg-white">
                    {slide.imageUrl ? (
                      <Image
                        src={slide.imageUrl}
                        alt={`Slide ${index + 1} do hero`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/65 p-4">
                        <Image
                          src="/logo-9-ilhas.svg"
                          alt="9 Ilhas Perfumaria"
                          width={170}
                          height={44}
                          className="h-auto w-28 opacity-80"
                        />
                      </div>
                    )}
                  </div>
                  <label className="mt-3 flex min-h-12 items-center rounded-2xl border border-dashed px-4 text-sm text-slate-500">
                    <input
                      name={`heroSlideFile${index + 1}`}
                      type="file"
                      accept="image/*"
                      className="w-full"
                    />
                  </label>
                  <div className="mt-3">
                    <label className="mb-2 block text-sm font-medium text-[color:var(--ink)]">
                      Segundos visível
                    </label>
                    <input
                      name={`heroSlideDuration${index + 1}`}
                      type="number"
                      min="1"
                      max="30"
                      defaultValue={slide.durationSeconds}
                      className="h-12 w-full rounded-2xl border px-4"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <input
            name="catalogTitle"
            defaultValue={settings.catalogTitle}
            placeholder="Título do catálogo"
            className="h-12 rounded-2xl border px-4 md:col-span-2"
            required
          />
          <textarea
            name="catalogIntro"
            defaultValue={settings.catalogIntro}
            placeholder="Introdução do catálogo"
            className="min-h-24 rounded-2xl border px-4 py-3 md:col-span-2"
            required
          />
          <input
            name="contactTitle"
            defaultValue={settings.contactTitle}
            placeholder="Título da página contactos"
            className="h-12 rounded-2xl border px-4 md:col-span-2"
            required
          />
          <textarea
            name="contactIntro"
            defaultValue={settings.contactIntro}
            placeholder="Introdução dos contactos"
            className="min-h-24 rounded-2xl border px-4 py-3 md:col-span-2"
            required
          />
          <textarea
            name="footerDescription"
            defaultValue={settings.footerDescription}
            placeholder="Texto do rodapé"
            className="min-h-24 rounded-2xl border px-4 py-3 md:col-span-2"
            required
          />

          <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white md:col-span-2">
            Guardar dados da loja
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
