import Link from "next/link";
import { Clock3, MapPin, MessageCircleMore, Phone } from "lucide-react";
import { getSocialLinks, getStoreSettings } from "@/lib/store-settings";

export default async function ContactosPage() {
  const [settings, socialLinks] = await Promise.all([
    getStoreSettings(),
    getSocialLinks(),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-4 lg:px-5 lg:py-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2.5rem] border border-[color:var(--line)] bg-white/85 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
            Contactos
          </p>
          <h1 className="mt-3 font-serif text-5xl text-[color:var(--ink)]">
            {settings.contactTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            {settings.contactIntro}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: MapPin, title: "Localização", copy: settings.location },
              { icon: Phone, title: "Telefone", copy: settings.phone },
              {
                icon: MessageCircleMore,
                title: "WhatsApp",
                copy: settings.whatsappLabel,
              },
              { icon: Clock3, title: "Horário", copy: settings.openingHours },
            ].map(({ icon: Icon, title, copy }) => (
              <article
                key={title}
                className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[color:var(--atlantic)] shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-serif text-2xl text-[color:var(--ink)]">{title}</h2>
                <p className="mt-2 text-sm text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_#ffffff,_#f4efe4)] p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--green)]">
            Redes sociais
          </p>
          <h2 className="mt-3 font-serif text-4xl text-[color:var(--ink)]">
            Acompanhe a loja nos canais certos
          </h2>
          <div className="mt-8 space-y-3">
            {socialLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href ?? "#"}
                target="_blank"
                className="flex items-center justify-between rounded-full border border-[color:var(--line)] bg-white px-5 py-4 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)]"
              >
                <span>{item.label}</span>
                <span className="text-[color:var(--atlantic)]">Abrir</span>
              </Link>
            ))}

            <Link
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              className="flex items-center justify-center rounded-full bg-[color:var(--atlantic)] px-5 py-4 text-sm font-semibold text-white"
            >
              Falar no WhatsApp
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-[2.5rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_#ffffff,_#f5efe5)] p-8 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
              Mapa
            </p>
            <h2 className="mt-3 font-serif text-4xl text-[color:var(--ink)]">
              Ilha Terceira, Açores
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Atendimento a partir da Ilha Terceira, com apoio próximo para encomendas e entregas
              nos Açores.
            </p>
          </div>
          <Link
            href="https://www.google.com/maps/search/Ilha+Terceira,+A%C3%A7ores"
            target="_blank"
            className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)]"
          >
            Abrir no mapa
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-white">
          <iframe
            title="Mapa da Ilha Terceira"
            src="https://www.google.com/maps?q=Ilha%20Terceira%2C%20A%C3%A7ores&z=10&output=embed"
            className="h-[340px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </div>
  );
}
