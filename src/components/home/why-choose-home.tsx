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
    <section className="space-y-4 sm:space-y-6">
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
          {eyebrow}
        </p>
        <h2 className="text-[2rem] leading-tight text-[color:var(--ink)] sm:text-[2.6rem]">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-5">
        {visibleItems.map((item, index) => {
          const Icon = trustIcons[index] ?? PackageCheck;

          return (
            <article
              key={`${item.title}-${index}`}
              className="rounded-[1.25rem] border border-[rgba(194,162,119,0.18)] bg-white/92 p-3.5 shadow-[0_10px_24px_rgba(95,71,49,0.05)] last:col-span-2 sm:rounded-[1.8rem] sm:p-5 sm:last:col-span-1"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(183,146,107,0.12)] text-[color:var(--gold)] sm:h-12 sm:w-12 sm:rounded-2xl">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm leading-snug text-[color:var(--ink)] sm:mt-4 sm:text-[1.05rem]">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">{item.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
