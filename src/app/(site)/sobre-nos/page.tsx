import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock3, Mail, MapPin, MessageCircleMore } from "lucide-react";
import { TrackedWhatsAppLink } from "@/components/analytics/tracked-whatsapp-link";
import { buildPageMetadata } from "@/lib/seo";
import { getStoreSettings } from "@/lib/store-settings";

const trustPoints = [
  "Perfumes 100% Originais",
  "Produtos Selados",
  "Fornecedores Certificados",
  "Entrega na Ilha Terceira",
  "Envio para A\u00e7ores, Madeira e Portugal Continental",
  "Apoio por WhatsApp",
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();

  return buildPageMetadata({
    title: "Sobre N\u00f3s",
    description:
      "Conhe\u00e7a a Perfumaria 9 Ilhas, da Praia da Vit\u00f3ria, Ilha Terceira, especializada em perfumes \u00e1rabes originais com atendimento pr\u00f3ximo e entrega r\u00e1pida.",
    path: "/sobre-nos",
    imageUrl: settings.heroImageUrl,
  });
}

export default async function SobreNosPage() {
  const settings = await getStoreSettings();

  const contacts = [
    { icon: MapPin, label: "Localiza\u00e7\u00e3o", value: settings.location },
    {
      icon: MessageCircleMore,
      label: "WhatsApp",
      value: settings.phone,
      href: settings.whatsappNumber ? `https://wa.me/${settings.whatsappNumber}` : undefined,
    },
    {
      icon: Mail,
      label: "Email",
      value: settings.contactEmail || "perfumaria9ilhas@hotmail.com",
      href: `mailto:${settings.contactEmail || "perfumaria9ilhas@hotmail.com"}`,
    },
    {
      icon: Clock3,
      label: "Hor\u00e1rio",
      value: settings.openingHours,
    },
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-4 lg:px-5 lg:py-6">
      <section className="rounded-[2.5rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_#ffffff,_#f6efe4)] p-8 shadow-sm lg:p-10">
        <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--gold)]">
          {"Sobre N\u00f3s"}
        </p>
        <h1 className="mt-3 text-4xl text-[color:var(--ink)] md:text-5xl">Sobre N\u00f3s</h1>
        <div className="mt-6 max-w-4xl space-y-4 text-base leading-8 text-slate-700">
          <p>{settings.contactIntro}</p>
          <p>
            {
              "Somos a Ana e o Carlos, da Ilha Terceira. Cri\u00e1mos a Perfumaria 9 Ilhas para trazer perfumes \u00e1rabes originais aos A\u00e7ores, com atendimento pr\u00f3ximo, produtos originais e entrega r\u00e1pida."
            }
          </p>
          <p>
            {
              "A nossa miss\u00e3o \u00e9 oferecer fragr\u00e2ncias \u00e1rabes cuidadosamente selecionadas, com confian\u00e7a, proximidade e um atendimento personalizado."
            }
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[2.5rem] border border-[color:var(--line)] bg-white/90 p-8 shadow-sm lg:p-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
              {"Confian\u00e7a"}
            </p>
            <h2 className="mt-3 text-3xl text-[color:var(--ink)] md:text-4xl">
              {"Produtos aut\u00eanticos e atendimento pr\u00f3ximo"}
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)]"
          >
            {"Ver cat\u00e1logo"}
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trustPoints.map((point) => (
            <article
              key={point}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[color:var(--gold)] shadow-sm">
                  <Check className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold text-[color:var(--ink)]">{point}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[2.5rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_#ffffff,_#f6efe4)] p-8 shadow-sm lg:p-10">
        <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--green)]">Contactos</p>
        <h2 className="mt-3 text-3xl text-[color:var(--ink)] md:text-4xl">
          {"Estamos dispon\u00edveis para ajudar"}
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {contacts.map(({ icon: Icon, label, value, href }) => {
            const content = (
              <div className="flex items-start gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--sand-soft)] text-[color:var(--atlantic)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--gold)]">
                    {label}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{value}</p>
                </div>
              </div>
            );

            if (label === "WhatsApp" && href) {
              return (
                <TrackedWhatsAppLink
                  key={label}
                  href={href}
                  contentName={"WhatsApp sobre n\u00f3s"}
                  className="block"
                >
                  {content}
                </TrackedWhatsAppLink>
              );
            }

            return href ? (
              <Link key={label} href={href} target="_blank" className="block">
                {content}
              </Link>
            ) : (
              <div key={label}>{content}</div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
