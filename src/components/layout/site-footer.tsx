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
    <footer className="border-t border-[color:var(--line)] bg-[color:var(--sand-soft)]">
      <div className="mx-auto grid max-w-[1240px] gap-5 px-4 py-8 lg:grid-cols-[1.2fr_0.9fr_1fr_1fr_1fr] lg:px-5">
        <div className="space-y-3">
          <Image
            src="/logo-9-ilhas.svg"
            alt="9 Ilhas Perfumaria"
            width={240}
            height={64}
            className="h-auto w-40"
          />
          <h3 className="font-serif text-[2rem] leading-tight text-[color:var(--ink)]">
            Perfumaria árabe com atendimento próximo.
          </h3>
          <p className="max-w-md text-sm leading-7 text-slate-600">
            {settings.footerDescription}
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--ink)]">
            Navegação
          </h4>
          <div className="space-y-2 text-sm text-slate-600">
            <Link className="block hover:text-[color:var(--atlantic)]" href="/">
              Início
            </Link>
            <Link className="block hover:text-[color:var(--atlantic)]" href="/catalogo">
              Catálogo
            </Link>
            <Link className="block hover:text-[color:var(--atlantic)]" href="/condicoes">
              Condições
            </Link>
            <Link className="block hover:text-[color:var(--atlantic)]" href="/contactos">
              Contactos
            </Link>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--ink)]">
            Contacto
          </h4>
          <div className="space-y-2 text-sm text-slate-600">
            <p>{settings.location}</p>
            <p>{settings.phone}</p>
            <p>WhatsApp: +{settings.whatsappNumber}</p>
            {settings.contactEmail ? <p>{settings.contactEmail}</p> : null}
            <div className="flex flex-wrap gap-3 pt-2">
              {socialLinks.map((link) =>
                link.href ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    className="hover:text-[color:var(--atlantic)]"
                  >
                    {link.label}
                  </Link>
                ) : null,
              )}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--ink)]">
            Pagamentos
          </h4>
          <div className="space-y-2 text-sm text-slate-600">
            <p>MBWay</p>
            <p>Transferência Bancária</p>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--ink)]">
            Envios
          </h4>
          <div className="space-y-2 text-sm text-slate-600">
            <p>Envio CTT</p>
            <p>Entrega Local</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
