import Image from "next/image";
import Link from "next/link";
import type { PublicStoreSettings } from "@/lib/types";

export function SiteFooter({
  settings,
  socialLinks,
}: {
  settings: PublicStoreSettings;
  socialLinks: { href?: string; label: string }[];
}) {
  return (
    <footer className="mt-10">
      <div className="bg-[linear-gradient(90deg,_#b88746,_#d1a15f)] text-white">
        <div className="mx-auto grid max-w-[1320px] gap-4 px-4 py-4 text-center sm:grid-cols-2 lg:grid-cols-5 lg:px-5">
          {[
            "Perfumes 100% Originais",
            "Entrega Local",
            "Apoio por WhatsApp",
            "Decants Disponíveis",
            "Atendimento Personalizado",
          ].map((item) => (
            <div
              key={item}
              className="text-sm font-semibold uppercase tracking-[0.14em] text-white"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[color:#1f1814] text-[color:#efe4d4]">
        <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.9fr_1fr_1.1fr] lg:px-5">
          <div className="space-y-4">
            <Image
              src="/logo-9-ilhas.svg"
              alt="9 Ilhas Perfumaria"
              width={260}
              height={70}
              className="h-auto w-44 brightness-[1.06]"
            />
            <p className="max-w-md text-sm leading-7 text-[rgba(239,228,212,0.82)]">
              {settings.footerDescription}
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-sm text-[rgba(239,228,212,0.84)]">
              {socialLinks.map((link) =>
                link.href ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    className="hover:text-white"
                  >
                    {link.label}
                  </Link>
                ) : null,
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-white">
              Links Rápidos
            </h4>
            <div className="space-y-2 text-sm text-[rgba(239,228,212,0.82)]">
              <Link className="block hover:text-white" href="/">
                Início
              </Link>
              <Link className="block hover:text-white" href="/catalogo">
                Perfumes
              </Link>
              <Link className="block hover:text-white" href="/condicoes">
                Decants 5ml
              </Link>
              <Link className="block hover:text-white" href="/conta">
                Conta
              </Link>
              <Link className="block hover:text-white" href="/sobre-nos">
                Sobre Nós
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-white">
              Contactos
            </h4>
            <div className="space-y-2 text-sm text-[rgba(239,228,212,0.82)]">
              <p>{settings.location}</p>
              <p>WhatsApp: +{settings.whatsappNumber}</p>
              {settings.contactEmail ? <p>{settings.contactEmail}</p> : null}
              <p>{settings.openingHours}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-white">
              Newsletter
            </h4>
            <p className="text-sm leading-7 text-[rgba(239,228,212,0.82)]">
              Receba novidades e promoções exclusivas.
            </p>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="O seu email"
                className="w-full rounded-md border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-sm text-white outline-none placeholder:text-[rgba(239,228,212,0.55)]"
              />
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-md bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-4 py-3 text-sm font-semibold text-white"
              >
                Subscrever
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.08)]">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-4 py-4 text-xs text-[rgba(239,228,212,0.72)] sm:flex-row sm:items-center sm:justify-between lg:px-5">
            <p>© 2026 Perfumaria 9 Ilhas. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <Link href="/condicoes" className="hover:text-white">
                Política de Privacidade
              </Link>
              <Link href="/condicoes" className="hover:text-white">
                Termos e Condições
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
