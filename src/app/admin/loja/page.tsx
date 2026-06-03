import { saveStoreSettings } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/store-settings";
import Image from "next/image";

export default async function AdminLojaPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <AdminShell
      title="Loja"
      description="Gerir contactos, redes sociais e textos visiveis no site."
    >
      <section className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
        <form
          action={saveStoreSettings}
          className="grid gap-4 md:grid-cols-2"
          encType="multipart/form-data"
        >
          <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">
                Hero masculino
              </p>
              {settings.heroMaleImageUrl ? (
                <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-2xl bg-white">
                  <Image
                    src={settings.heroMaleImageUrl}
                    alt="Hero masculino"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : null}
              <input name="heroMaleImageFile" type="file" accept="image/*" className="w-full rounded-2xl border px-4 py-3" />
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">
                Hero feminino
              </p>
              {settings.heroFemaleImageUrl ? (
                <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-2xl bg-white">
                  <Image
                    src={settings.heroFemaleImageUrl}
                    alt="Hero feminino"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : null}
              <input name="heroFemaleImageFile" type="file" accept="image/*" className="w-full rounded-2xl border px-4 py-3" />
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">
                Hero unissexo
              </p>
              {settings.heroUnisexImageUrl ? (
                <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-2xl bg-white">
                  <Image
                    src={settings.heroUnisexImageUrl}
                    alt="Hero unissexo"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : null}
              <input name="heroUnisexImageFile" type="file" accept="image/*" className="w-full rounded-2xl border px-4 py-3" />
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">
                Imagem dos decants
              </p>
              {settings.decantsImageUrl ? (
                <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-2xl bg-white">
                  <Image
                    src={settings.decantsImageUrl}
                    alt="Imagem dos decants"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : null}
              <input name="decantsImageFile" type="file" accept="image/*" className="w-full rounded-2xl border px-4 py-3" />
            </div>
          </div>

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
            placeholder="WhatsApp sem espacos"
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
            placeholder="Localizacao"
            className="h-12 rounded-2xl border px-4"
            required
          />
          <input
            name="openingHours"
            defaultValue={settings.openingHours}
            placeholder="Horario"
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
            placeholder="Titulo principal da home"
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

          <input
            name="catalogTitle"
            defaultValue={settings.catalogTitle}
            placeholder="Titulo do catalogo"
            className="h-12 rounded-2xl border px-4 md:col-span-2"
            required
          />
          <textarea
            name="catalogIntro"
            defaultValue={settings.catalogIntro}
            placeholder="Introducao do catalogo"
            className="min-h-24 rounded-2xl border px-4 py-3 md:col-span-2"
            required
          />
          <input
            name="contactTitle"
            defaultValue={settings.contactTitle}
            placeholder="Titulo da pagina contactos"
            className="h-12 rounded-2xl border px-4 md:col-span-2"
            required
          />
          <textarea
            name="contactIntro"
            defaultValue={settings.contactIntro}
            placeholder="Introducao dos contactos"
            className="min-h-24 rounded-2xl border px-4 py-3 md:col-span-2"
            required
          />
          <textarea
            name="footerDescription"
            defaultValue={settings.footerDescription}
            placeholder="Texto do rodape"
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
