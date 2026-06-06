import Link from "next/link";

export function AboutHome() {
  return (
    <section className="rounded-[2.25rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_#ffffff,_#f6efe4)] p-7 shadow-sm lg:p-9">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--gold)]">
            Sobre a marca
          </p>
          <h2 className="mt-3 text-[1.7rem] leading-tight text-[color:var(--ink)] sm:text-[2.2rem]">
            Conheça a Perfumaria 9 Ilhas
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-7 text-slate-600 sm:text-[15px]">
            Somos da Ilha Terceira e trabalhamos com perfumes árabes originais, decants e
            atendimento próximo para o ajudar a escolher a fragrância ideal.
          </p>
        </div>

        <div className="flex lg:justify-end">
          <Link
            href="/sobre-nos"
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d0a260)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Saber mais sobre nós
          </Link>
        </div>
      </div>
    </section>
  );
}
