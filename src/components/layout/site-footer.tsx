import Image from "next/image";
import Link from "next/link";
import { SocialIcon } from "@/components/layout/social-icons";
import { TrackedWhatsAppLink } from "@/components/analytics/tracked-whatsapp-link";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import type { PublicStoreSettings } from "@/lib/types";

export function SiteFooter({
  settings,
  socialLinks,
}: {
  settings: PublicStoreSettings;
  socialLinks: { href?: string; label: string }[];
}) {
  return (
    <footer className="store-footer mt-16 border-t border-black/10 bg-[color:#f1e9dc] text-[color:#44382d]">
      <div className="mx-auto max-w-[1420px] px-5 py-14 lg:px-6 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.9fr_1fr]">
          <div className="space-y-5">
            <Image
              src="/logo-9-ilhas.svg"
              alt="9 Ilhas Perfumaria"
              width={300}
              height={90}
              className="h-auto w-44 brightness-[1.08]"
            />
            <p className="max-w-md text-sm leading-7 text-[color:#655748]">
              {"Perfumaria 9 Ilhas - Fragr\u00e2ncias que marcam presen\u00e7a."}
            </p>
            <p className="max-w-md text-sm leading-7 text-[color:#655748]">
              {settings.footerDescription}
            </p>
            <div className="space-y-1 text-sm leading-7 text-[color:#655748]">
              <p>{"Praia da Vit\u00f3ria, Ilha Terceira - A\u00e7ores, Portugal"}</p>
              <p>{"Entregas em m\u00e3o na Ilha Terceira."}</p>
              <p>{"Envios via CTT para A\u00e7ores, Madeira e Portugal Continental."}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:#44382d]">
              {"Navega\u00e7\u00e3o"}
            </h4>
            <div className="space-y-2 text-sm text-[color:#655748]">
              <Link className="block hover:text-[color:#44382d]" href="/">
                {"In\u00edcio"}
              </Link>
              <Link className="block hover:text-[color:#44382d]" href="/catalogo">
                {"Cat\u00e1logo"}
              </Link>
              <Link className="block hover:text-[color:#44382d]" href="/perfumes-arabes-acores">
                {"Perfumes \u00e1rabes nos A\u00e7ores"}
              </Link>
              <Link className="block hover:text-[color:#44382d]" href="/sobre-nos">
                {"Sobre N\u00f3s"}
              </Link>
              <Link className="block hover:text-[color:#44382d]" href="/condicoes">
                {"Condi\u00e7\u00f5es"}
              </Link>
              <Link className="block hover:text-[color:#44382d]" href="/politica-de-privacidade">
                Política de Privacidade
              </Link>
              <CookieSettingsButton />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:#44382d]">
              Contacto
            </h4>
            <div className="space-y-2 text-sm leading-7 text-[color:#655748]">
              <p>{"Praia da Vit\u00f3ria, Ilha Terceira, A\u00e7ores"}</p>
              <p>WhatsApp: +{settings.whatsappNumber}</p>
              {settings.contactEmail ? <p>{settings.contactEmail}</p> : null}
              <p>{settings.openingHours}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:#44382d]">
              Siga-nos
            </h4>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(({ href, label }) => {
                if (!href) {
                  return null;
                }

                const icon = <SocialIcon label={label} />;

                if (label === "WhatsApp") {
                  return (
                    <TrackedWhatsAppLink
                      key={label}
                      href={href}
                      contentName="WhatsApp footer"
                      ariaLabel="WhatsApp"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/60 text-[color:#44382d] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                    >
                      {icon}
                    </TrackedWhatsAppLink>
                  );
                }

                return (
                  <Link
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/60 text-[color:#44382d] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                    aria-label={label}
                  >
                    {icon}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[color:var(--line)] pt-5 text-xs text-[color:#655748]">
          {"\u00a9 2026 Perfumaria 9 Ilhas. Todos os direitos reservados."}
        </div>
      </div>
    </footer>
  );
}
