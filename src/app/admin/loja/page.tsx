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
      description="Gerir a informação principal da loja, imagens e redes sociais."
    >
      <section className="mb-5 rounded-[1.8rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--gold)]">
          Sobre Nós
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Os textos institucionais, contactos e introdução da página Sobre Nós são
          geridos na aba dedicada do admin.
        </p>
        <div className="mt-4">
          <a
            href="/admin/sobre-nos"
            className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)]"
          >
            Abrir aba Sobre Nós
          </a>
        </div>
      </section>

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
              <input
                name="heroMaleImageFile"
                type="file"
                accept="image/*"
                className="w-full rounded-2xl border px-4 py-3"
              />
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
              <input
                name="heroFemaleImageFile"
                type="file"
                accept="image/*"
                className="w-full rounded-2xl border px-4 py-3"
              />
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
              <input
                name="heroUnisexImageFile"
                type="file"
                accept="image/*"
                className="w-full rounded-2xl border px-4 py-3"
              />
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
              <input
                name="decantsImageFile"
                type="file"
                accept="image/*"
                className="w-full rounded-2xl border px-4 py-3"
              />
            </div>
          </div>

          <input
            name="storeName"
            defaultValue={settings.storeName}
            placeholder="Nome da loja"
            className="h-12 rounded-2xl border px-4"
            required
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
