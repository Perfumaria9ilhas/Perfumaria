import Link from "next/link";
import { MapPin } from "lucide-react";

export function AboutHome() {
  return (
    <section className="grid gap-6 rounded-[2.4rem] border border-[rgba(194,162,119,0.16)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(247,239,229,0.94))] p-6 shadow-[0_20px_44px_rgba(95,71,49,0.08)] lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
          Sobre nós
        </p>
        <div className="space-y-3">
          <h2 className="text-[2rem] leading-tight text-[color:var(--ink)] sm:text-[2.7rem]">
            Ana e Carlos
          </h2>
          <div className="flex items-center gap-2 text-sm text-[color:var(--atlantic)]">
            <MapPin className="h-4 w-4" />
            <span>Praia da Vitória, Ilha Terceira</span>
          </div>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          Somos uma perfumaria da Ilha Terceira especializada em perfumes árabes
          originais. Acreditamos num atendimento próximo, honesto e personalizado para
          ajudar cada cliente a encontrar a fragrância ideal.
        </p>
        <Link
          href="/sobre-nos"
          className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d2a35f)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(184,135,70,0.18)] transition hover:opacity-95"
        >
          Conhecer a Nossa História
        </Link>
      </div>

      <div className="rounded-[2rem] border border-dashed border-[rgba(183,146,107,0.28)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.84),_rgba(248,239,228,0.88))] p-6">
        <div className="flex h-full min-h-[18rem] flex-col items-center justify-center rounded-[1.6rem] bg-[radial-gradient(circle_at_top,_rgba(183,146,107,0.14),_transparent_52%),linear-gradient(180deg,_rgba(255,255,255,0.72),_rgba(249,240,229,0.82))] px-6 text-center">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(183,146,107,0.24)] bg-white/88 text-xl text-[color:var(--gold)]">
              A
            </span>
            <span className="h-px w-8 bg-[rgba(183,146,107,0.24)]" />
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(183,146,107,0.24)] bg-white/88 text-xl text-[color:var(--gold)]">
              C
            </span>
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.26em] text-[color:var(--atlantic)]">
            Espaço reservado para fotografia real
          </p>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
            Aqui ficará a fotografia oficial da Ana e do Carlos, integrada no mesmo
            estilo premium da marca.
          </p>
        </div>
      </div>
    </section>
  );
}
