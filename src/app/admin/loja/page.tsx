import type { ReactNode } from "react";
import { saveStoreSettings } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/store-settings";
import Image from "next/image";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.8rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-5 shadow-sm md:col-span-2">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--gold)]">
          {title}
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function TextInput({
  name,
  defaultValue,
  placeholder,
  required = false,
}: {
  name: string;
  defaultValue?: string | null;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      className="h-12 rounded-2xl border px-4"
      required={required}
    />
  );
}

function TextArea({
  name,
  defaultValue,
  placeholder,
  required = false,
  rows = 4,
}: {
  name: string;
  defaultValue?: string | null;
  placeholder: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <textarea
      name={name}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      rows={rows}
      className="min-h-24 rounded-2xl border px-4 py-3"
      required={required}
    />
  );
}

export default async function AdminLojaPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <AdminShell
      title="Loja"
      description="Editar os textos e a imagem que aparecem na página inicial."
    >
      <section className="mb-5 rounded-[1.8rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--gold)]">
          Sobre Nós
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          A história da marca, os contactos e a informação institucional continuam na aba
          própria de Sobre Nós.
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
        <form action={saveStoreSettings} className="grid gap-4 md:grid-cols-2" encType="multipart/form-data">
          <SectionCard
            title="Hero principal"
            description="Controla o bloco de boas-vindas do topo da homepage."
          >
            <TextInput
              name="storeName"
              defaultValue={settings.storeName}
              placeholder="Nome da loja"
              required
            />
            <TextInput
              name="heroTitle"
              defaultValue={settings.heroTitle}
              placeholder="Título principal da home"
              required
            />
            <div className="md:col-span-2">
              <TextArea
                name="heroDescription"
                defaultValue={settings.heroDescription}
                placeholder="Descrição principal da home"
                required
              />
            </div>
            <TextInput
              name="heroPrimaryButtonLabel"
              defaultValue={settings.heroPrimaryButtonLabel}
              placeholder="Texto do botão principal"
              required
            />
            <TextInput
              name="heroSecondaryButtonLabel"
              defaultValue={settings.heroSecondaryButtonLabel}
              placeholder="Texto do botão secundário"
              required
            />
            <TextInput
              name="heroBenefitOne"
              defaultValue={settings.heroBenefitOne}
              placeholder="Benefício 1"
              required
            />
            <TextInput
              name="heroBenefitTwo"
              defaultValue={settings.heroBenefitTwo}
              placeholder="Benefício 2"
              required
            />
            <TextInput
              name="heroBenefitThree"
              defaultValue={settings.heroBenefitThree}
              placeholder="Benefício 3"
              required
            />
            <TextInput
              name="heroBenefitFour"
              defaultValue={settings.heroBenefitFour}
              placeholder="Benefício 4"
              required
            />
          </SectionCard>

          <SectionCard
            title="Preferidos dos clientes"
            description="Controla o título e o texto da secção de best sellers."
          >
            <TextInput
              name="homeFeaturedEyebrow"
              defaultValue={settings.homeFeaturedEyebrow}
              placeholder="Pequeno título da secção"
              required
            />
            <TextInput
              name="homeFeaturedTitle"
              defaultValue={settings.homeFeaturedTitle}
              placeholder="Título da secção"
              required
            />
            <div className="md:col-span-2">
              <TextArea
                name="homeFeaturedDescription"
                defaultValue={settings.homeFeaturedDescription}
                placeholder="Descrição da secção"
                required
              />
            </div>
            <TextInput
              name="homeFeaturedButtonLabel"
              defaultValue={settings.homeFeaturedButtonLabel}
              placeholder="Texto do botão"
              required
            />
          </SectionCard>

          <SectionCard
            title="Decants"
            description="Edita o pequeno bloco complementar dos decants."
          >
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4 md:col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">
                Imagem dos decants
              </p>
              {settings.decantsImageUrl ? (
                <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-2xl bg-[color:var(--sand-soft)]">
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
            <TextInput
              name="homeDecantsEyebrow"
              defaultValue={settings.homeDecantsEyebrow}
              placeholder="Pequeno título da secção"
              required
            />
            <TextInput
              name="homeDecantsTitle"
              defaultValue={settings.homeDecantsTitle}
              placeholder="Título da secção"
              required
            />
            <div className="md:col-span-2">
              <TextArea
                name="homeDecantsDescription"
                defaultValue={settings.homeDecantsDescription}
                placeholder="Descrição da secção"
                required
              />
            </div>
            <TextInput
              name="homeDecantsButtonLabel"
              defaultValue={settings.homeDecantsButtonLabel}
              placeholder="Texto do botão"
              required
            />
          </SectionCard>

          <SectionCard
            title="Porque comprar"
            description="Edita a secção de confiança da homepage."
          >
            <TextInput
              name="homeWhyChooseEyebrow"
              defaultValue={settings.homeWhyChooseEyebrow}
              placeholder="Pequeno título da secção"
              required
            />
            <TextInput
              name="homeWhyChooseTitle"
              defaultValue={settings.homeWhyChooseTitle}
              placeholder="Título da secção"
              required
            />
            <TextInput
              name="whyChooseItemOneTitle"
              defaultValue={settings.whyChooseItemOneTitle}
              placeholder="Cartão 1 título"
              required
            />
            <TextInput
              name="whyChooseItemOneText"
              defaultValue={settings.whyChooseItemOneText}
              placeholder="Cartão 1 texto"
              required
            />
            <TextInput
              name="whyChooseItemTwoTitle"
              defaultValue={settings.whyChooseItemTwoTitle}
              placeholder="Cartão 2 título"
              required
            />
            <TextInput
              name="whyChooseItemTwoText"
              defaultValue={settings.whyChooseItemTwoText}
              placeholder="Cartão 2 texto"
              required
            />
            <TextInput
              name="whyChooseItemThreeTitle"
              defaultValue={settings.whyChooseItemThreeTitle}
              placeholder="Cartão 3 título"
              required
            />
            <TextInput
              name="whyChooseItemThreeText"
              defaultValue={settings.whyChooseItemThreeText}
              placeholder="Cartão 3 texto"
              required
            />
            <TextInput
              name="whyChooseItemFourTitle"
              defaultValue={settings.whyChooseItemFourTitle}
              placeholder="Cartão 4 título"
              required
            />
            <TextInput
              name="whyChooseItemFourText"
              defaultValue={settings.whyChooseItemFourText}
              placeholder="Cartão 4 texto"
              required
            />
            <TextInput
              name="whyChooseItemFiveTitle"
              defaultValue={settings.whyChooseItemFiveTitle}
              placeholder="Cartão 5 título"
              required
            />
            <TextInput
              name="whyChooseItemFiveText"
              defaultValue={settings.whyChooseItemFiveText}
              placeholder="Cartão 5 texto"
              required
            />
          </SectionCard>

          <SectionCard
            title="Testemunhos"
            description="Edita os textos da secção de comentários dos clientes."
          >
            <TextInput
              name="homeTestimonialsEyebrow"
              defaultValue={settings.homeTestimonialsEyebrow}
              placeholder="Pequeno título da secção"
              required
            />
            <TextInput
              name="homeTestimonialsTitle"
              defaultValue={settings.homeTestimonialsTitle}
              placeholder="Título da secção"
              required
            />
          </SectionCard>

          <SectionCard
            title="Catálogo e rodapé"
            description="Controla o texto do catálogo, do rodapé e as redes sociais."
          >
            <TextInput
              name="catalogTitle"
              defaultValue={settings.catalogTitle}
              placeholder="Título do catálogo"
              required
            />
            <div className="md:col-span-2">
              <TextArea
                name="catalogIntro"
                defaultValue={settings.catalogIntro}
                placeholder="Introdução do catálogo"
                required
              />
            </div>
            <div className="md:col-span-2">
              <TextArea
                name="footerDescription"
                defaultValue={settings.footerDescription}
                placeholder="Texto do rodapé"
                required
              />
            </div>
            <TextInput
              name="instagramUrl"
              defaultValue={settings.instagramUrl ?? ""}
              placeholder="Link Instagram"
            />
            <TextInput
              name="facebookUrl"
              defaultValue={settings.facebookUrl ?? ""}
              placeholder="Link Facebook"
            />
            <TextInput
              name="tiktokUrl"
              defaultValue={settings.tiktokUrl ?? ""}
              placeholder="Link TikTok"
            />
          </SectionCard>

          <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white md:col-span-2">
            Guardar dados da homepage
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
