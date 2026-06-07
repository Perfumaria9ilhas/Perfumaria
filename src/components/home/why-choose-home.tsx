"use client";

import {
  MessageCircleMore,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";

type WhyChooseItem = {
  title: string;
  text: string;
};

const trustIcons = [Truck, Truck, ShieldCheck, MessageCircleMore, PackageCheck];

type WhyChooseHomeProps = {
  eyebrow: string;
  title: string;
  items: WhyChooseItem[];
};

export function WhyChooseHome({ eyebrow, title, items }: WhyChooseHomeProps) {
  const visibleItems = items.filter((item) => item.title && item.text);

  return (
    <section className="space-y-6">
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
          {eyebrow}
        </p>
        <h2 className="text-[2rem] leading-tight text-[color:var(--ink)] sm:text-[2.6rem]">
          {title}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {visibleItems.map((item, index) => {
          const Icon = trustIcons[index] ?? PackageCheck;

          return (
            <article
              key={`${item.title}-${index}`}
              className="rounded-[1.8rem] border border-[rgba(194,162,119,0.18)] bg-white/92 p-5 shadow-[0_14px_34px_rgba(95,71,49,0.06)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(183,146,107,0.12)] text-[color:var(--gold)]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[1.05rem] leading-snug text-[color:var(--ink)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
