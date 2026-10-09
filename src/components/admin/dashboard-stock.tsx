"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { AdminStockRow } from "@/lib/stock";
import { QuickStockEditor } from "./quick-stock-editor";
export function DashboardStock({ rows }: { rows: AdminStockRow[] }) {
  const [selected, setSelected] = useState<AdminStockRow | null>(null);
  return <section className="min-w-0"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-serif text-xl">Stock que precisa de atenção</h2><Link href="/admin/stock?view=stock&status=low" className="shrink-0 text-xs underline">Ver stock completo</Link></div><div className="overflow-hidden rounded-2xl border bg-white">{rows.length ? rows.map(row => <button type="button" key={row.id} onClick={() => setSelected(row)} className="flex min-h-20 w-full items-center gap-3 border-b p-3 text-left last:border-0"><Image src={row.imageUrl || "/logo-9-ilhas.svg"} alt="" width={40} height={48} unoptimized className="h-12 w-10 shrink-0 object-contain" /><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{row.name}</strong><span className="text-xs text-slate-500">{row.brandName}</span></span><strong className="text-sm text-red-700">{row.stock}</strong><ChevronRight size={16} /></button>) : <p className="p-4 text-sm text-slate-500">Nenhum produto com stock baixo.</p>}</div>{selected ? <QuickStockEditor key={selected.id} row={selected} onClose={() => setSelected(null)} onSave={() => {}} /> : null}</section>;
}
