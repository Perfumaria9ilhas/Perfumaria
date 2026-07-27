import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  MessageCircleMore,
  PackageCheck,
  Send,
  ShieldCheck,
} from "lucide-react";
import { TrackedWhatsAppLink } from "@/components/analytics/tracked-whatsapp-link";
import { buildFaqJsonLd, buildPageMetadata, safeJsonLd } from "@/lib/seo";
import { getStoreSettings } from "@/lib/store-settings";

const localFaqItems = [
  {
    question: "Onde comprar perfumes \u00e1rabes na Ilha Terceira?",
    answer:
      "A Perfumaria 9 Ilhas, na Praia da Vit\u00f3ria, disponibiliza perfumes \u00e1rabes originais com entrega local na Ilha Terceira e apoio por WhatsApp.",
  },
  {
    question: "A Perfumaria 9 Ilhas faz entregas na Ilha Terceira?",
    answer:
      "Sim. Sempre que poss\u00edvel, a Perfumaria 9 Ilhas faz entrega em m\u00e3o na Ilha Terceira, al\u00e9m de enviar encomendas para outras ilhas e para Portugal Continental.",
  },
  {
    question: "Enviam perfumes para outras ilhas dos A\u00e7ores?",
    answer:
      "Sim. A loja envia perfumes para outras ilhas dos A\u00e7ores, para a Madeira e para Portugal Continental atrav\u00e9s dos envios dispon\u00edveis no projeto.",
  },
  {
    question: "Os perfumes s\u00e3o originais?",
    answer:
      "Sim. A sele\u00e7\u00e3o da Perfumaria 9 Ilhas \u00e9 focada em perfumes \u00e1rabes originais e em refer\u00eancias escolhidas com crit\u00e9rio.",
  },
  {
    question: "Posso comprar perfumes \u00e1rabes online nos A\u00e7ores?",
    answer:
      "Sim. O cat\u00e1logo online permite ver produtos, adicionar ao carrinho e concluir o pedido por WhatsApp com apoio personalizado.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();

  return buildPageMetadata({
    title: "Perfumes \u00c1rabes nos A\u00e7ores",
    description:
      "Perfumes \u00e1rabes originais nos A\u00e7ores, com apoio a partir da Praia da Vit\u00f3ria, entrega local na Ilha Terceira e envios para Madeira e Portugal Continental.",
    path: "/perfumes-arabes-acores",
    imageUrl: settings.heroImageUrl,
  });
}

export default async function PerfumesArabesAcoresPage() {
  const settings = await getStoreSettings();
  const faqJsonLd = buildFaqJsonLd(localFaqItems);
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}`
    : undefined;

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-4 lg:px-5 lg:py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />

      <section className="rounded-[2.5rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_#ffffff,_#f6efe4)] px-8 py-10 shadow-sm lg:px-10">
        <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--gold)]">
          {"Praia da Vit\u00f3ria, Ilha Terceira"}
        </p>
        <h1 className="mt-3 text-4xl text-[color:var(--ink)] md:text-5xl">
          {"Perfumes \u00e1rabes nos A\u00e7ores"}
        </h1>
        <div className="mt-6 max-w-4xl space-y-4 text-base leading-8 text-slate-700">
          <p>
            {
              "A Perfumaria 9 Ilhas ajuda clientes da Praia da Vit\u00f3ria, da Ilha Terceira e de todo o arquip\u00e9lago dos A\u00e7ores a encontrar perfumes \u00e1rabes originais com confian\u00e7a, apoio pr\u00f3ximo e atendimento personalizado."
            }
          </p>
          <p>
            {
              "Trabalhamos com entrega em m\u00e3o na Ilha Terceira e envios para outras ilhas dos A\u00e7ores, Madeira e Portugal Continental, sempre com foco em fragr\u00e2ncias selecionadas e comunica\u00e7\u00e3o r\u00e1pida por WhatsApp."
            }
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/catalogo"
            className="rounded-full bg-[color:var(--atlantic)] px-6 py-3 text-sm font-semibold text-white"
          >
            {"Ver cat\u00e1logo"}
          </Link>
          <Link
            href="/sobre-nos"
            className="rounded-full border border-[color:var(--line)] bg-white px-6 py-3 text-sm font-semibold text-[color:var(--ink)]"
          >
            {"Conhecer a perfumaria"}
          </Link>
          {whatsappHref ? (
            <TrackedWhatsAppLink
              href={whatsappHref}
              contentName={"WhatsApp perfumes \u00e1rabes A\u00e7ores"}
              className="rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-6 py-3 text-sm font-semibold text-[color:var(--ink)]"
            >
              Falar no WhatsApp
            </TrackedWhatsAppLink>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: MapPin,
            title: "Perfumes \u00e1rabes na Ilha Terceira",
            text: "Atendimento a partir da Praia da Vit\u00f3ria, com apoio pr\u00f3ximo para clientes locais e acompanhamento da escolha da fragr\u00e2ncia.",
          },
          {
            icon: PackageCheck,
            title: "Perfumes originais",
            text: "Sele\u00e7\u00e3o focada em perfumes \u00e1rabes originais, perfumes masculinos, femininos e outras refer\u00eancias escolhidas com crit\u00e9rio.",
          },
          {
            icon: Send,
            title: "Envios para os A\u00e7ores",
            text: "Envios para outras ilhas dos A\u00e7ores, para a Madeira e para Portugal Continental, al\u00e9m da entrega local na Ilha Terceira.",
          },
          {
            icon: MessageCircleMore,
            title: "Cat\u00e1logo online e WhatsApp",
            text: "Pode ver o cat\u00e1logo online, escolher perfumes e finalizar a encomenda por WhatsApp de forma simples e personalizada.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <article
            key={title}
            className="rounded-[1.7rem] border border-[color:var(--line)] bg-white p-5 shadow-sm"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--sand-soft)] text-[color:var(--gold)]">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-xl text-[color:var(--ink)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
          <h2 className="text-2xl text-[color:var(--ink)]">
            {"Comprar perfumes \u00e1rabes online nos A\u00e7ores"}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {
              "O cat\u00e1logo da Perfumaria 9 Ilhas est\u00e1 dispon\u00edvel online para clientes da Ilha Terceira, de outras ilhas dos A\u00e7ores e de todo o pa\u00eds. Pode explorar perfumes masculinos, perfumes femininos e refer\u00eancias com formatos complementares, incluindo decants quando estiverem ativos nos produtos selecionados."
            }
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className="rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)]"
            >
              {"Abrir cat\u00e1logo"}
            </Link>
            <Link
              href="/sobre-nos"
              className="rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)]"
            >
              {"Sobre a Perfumaria 9 Ilhas"}
            </Link>
          </div>
        </article>

        <article className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-6 shadow-sm">
          <h2 className="text-2xl text-[color:var(--ink)]">
            {"Porqu\u00ea escolher a Perfumaria 9 Ilhas"}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {
              "A loja combina sele\u00e7\u00e3o cuidada de perfumes \u00e1rabes originais, acompanhamento pr\u00f3ximo por WhatsApp e servi\u00e7o adaptado \u00e0 realidade da Ilha Terceira e dos A\u00e7ores. O objetivo \u00e9 ajudar cada cliente a comprar com mais confian\u00e7a."
            }
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-[2.5rem] border border-[color:var(--line)] bg-white p-8 shadow-sm lg:p-10">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--green)]">FAQ</p>
          <h2 className="text-3xl text-[color:var(--ink)] md:text-4xl">
            {"Perguntas frequentes sobre perfumes \u00e1rabes nos A\u00e7ores"}
          </h2>
        </div>

        <div className="mt-8 space-y-4">
          {localFaqItems.map((item) => (
            <article
              key={item.question}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--gold)] shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-lg text-[color:var(--ink)]">{item.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
