import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Globe2,
  MessageCircleMore,
  Music2,
} from "lucide-react";
import { TrackedWhatsAppLink } from "@/components/analytics/tracked-whatsapp-link";
import type { PublicStoreSettings } from "@/lib/types";

export function SiteFooter({
  settings,
  socialLinks,
}: {
  settings: PublicStoreSettings;
  socialLinks: { href?: string; label: string }[];
}) {
  return (
    <footer className="mt-12 border-t border-[rgba(194,162,119,0.16)] bg-[linear-gradient(180deg,_#2a1f18,_#1d1510)] text-[color:#f3e7d6]">
      <div className="mx-auto max-w-[1320px] px-4 py-12 lg:px-5">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.9fr_1fr]">
          <div className="space-y-5">
            <Image
              src="/logo-9-ilhas.svg"
              alt="9 Ilhas Perfumaria"
              width={300}
              height={90}
              className="h-auto w-44 brightness-[1.08]"
            />
            <p className="max-w-md text-sm leading-7 text-[rgba(243,231,214,0.82)]">
              Perfumaria 9 Ilhas — Fragrâncias que marcam presença.
            </p>
            <p className="max-w-md text-sm leading-7 text-[rgba(243,231,214,0.72)]">
              {settings.footerDescription}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-white">
              Navegação
            </h4>
            <div className="space-y-2 text-sm text-[rgba(243,231,214,0.78)]">
              <Link className="block hover:text-white" href="/">
                Início
              </Link>
              <Link className="block hover:text-white" href="/catalogo">
                Catálogo
              </Link>
              <Link className="block hover:text-white" href="/sobre-nos">
                Sobre Nós
              </Link>
              <Link className="block hover:text-white" href="/condicoes">
                Condições
              </Link>
              <Link className="block hover:text-white" href="/condicoes">
                Política de Privacidade
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-white">
              Contacto
            </h4>
            <div className="space-y-2 text-sm leading-7 text-[rgba(243,231,214,0.78)]">
              <p>{settings.location}</p>
              <p>WhatsApp: +{settings.whatsappNumber}</p>
              {settings.contactEmail ? <p>{settings.contactEmail}</p> : null}
              <p>{settings.openingHours}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-white">
              Siga-nos
            </h4>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(({ href, label }) => {
                if (!href) {
                  return null;
                }

                const icon =
                  label === "Instagram" ? (
                    <Camera className="h-4 w-4" />
                  ) : label === "Facebook" ? (
                    <Globe2 className="h-4 w-4" />
                  ) : label === "TikTok" ? (
                    <Music2 className="h-4 w-4" />
                  ) : (
                    <MessageCircleMore className="h-4 w-4" />
                  );

                if (label === "WhatsApp") {
                  return (
                    <TrackedWhatsAppLink
                      key={label}
                      href={href}
                      contentName="WhatsApp footer"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] text-white transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
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
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] text-white transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                    aria-label={label}
                  >
                    {icon}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[rgba(255,255,255,0.08)] pt-5 text-xs text-[rgba(243,231,214,0.62)]">
          © 2026 Perfumaria 9 Ilhas. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
