import Link from "next/link";
import { Check, Clock3, Mail, MapPin, MessageCircleMore } from "lucide-react";

const trustPoints = [
  "Perfumes 100% Originais",
  "Produtos Selados",
  "Fornecedores Certificados",
  "Entrega na Ilha Terceira",
  "Envio para Açores, Madeira e Portugal Continental",
  "Apoio por WhatsApp",
];

const contacts = [
  { icon: MapPin, label: "Localização", value: "Ilha Terceira, Açores" },
  {
    icon: MessageCircleMore,
    label: "WhatsApp",
    value: "+351 965420948",
    href: "https://wa.me/351965420948",
  },
  {
    icon: Mail,
    label: "Email",
    value: "perfumaria9ilhas@hotmail.com",
    href: "mailto:perfumaria9ilhas@hotmail.com",
  },
  {
    icon: Clock3,
    label: "Horário",
    value: "Segunda a sábado, das 08h00 às 22h00",
  },
];

export default function SobreNosPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-4 lg:px-5 lg:py-6">
      <section className="rounded-[2.5rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_#ffffff,_#f6efe4)] p-8 shadow-sm lg:p-10">
        <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--gold)]">Sobre Nós</p>
        <h1 className="mt-3 text-4xl text-[color:var(--ink)] md:text-5xl">Sobre Nós</h1>
        <div className="mt-6 max-w-4xl space-y-4 text-base leading-8 text-slate-700">
          <p>
            Somos a Ana e o Carlos, da Ilha Terceira. Criámos a Perfumaria 9 Ilhas para
            trazer perfumes árabes originais aos Açores, com atendimento próximo, produtos
            originais e entrega rápida.
          </p>
          <p>
            A nossa missão é oferecer fragrâncias árabes cuidadosamente selecionadas, com
            confiança, proximidade e um atendimento personalizado.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[2.5rem] border border-[color:var(--line)] bg-white/90 p-8 shadow-sm lg:p-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
              Confiança
            </p>
            <h2 className="mt-3 text-3xl text-[color:var(--ink)] md:text-4xl">
              Produtos autênticos e atendimento próximo
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)]"
          >
            Ver catálogo
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
          Estamos disponíveis para ajudar
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
