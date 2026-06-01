import { faqItems } from "@/lib/constants";

export default function CondicoesPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-4 lg:px-5 lg:py-6">
      <section className="overflow-hidden rounded-[2.5rem] border border-white/30 bg-[linear-gradient(135deg,_rgba(92,68,47,0.98),_rgba(128,95,69,0.9),_rgba(161,132,98,0.82))] px-6 py-14 text-white shadow-[0_30px_80px_rgba(92,68,47,0.18)] lg:px-10">
        <p className="text-xs uppercase tracking-[0.35em] text-white/70">Condições</p>
        <h1 className="mt-3 font-serif text-5xl">Informação útil antes de encomendar</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-white/80">
          Respostas rápidas sobre encomendas, envios, pagamentos e apoio ao cliente.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        {faqItems.map((item) => (
          <details
            key={item.question}
            className="group rounded-[1.75rem] border border-[color:var(--line)] bg-white p-6 shadow-sm"
          >
            <summary className="cursor-pointer list-none font-serif text-3xl text-[color:var(--ink)]">
              {item.question}
            </summary>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">{item.answer}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
