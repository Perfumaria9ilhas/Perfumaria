"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { InventoryDialog } from "./inventory-dialog";
import { formatPrice } from "@/lib/format";
import { dailyPerfumePrice } from "@/lib/daily-perfume";
import type { CatalogProduct } from "@/lib/types";

export function DailyPerfumeCard({products,selectedId,version:initialVersion}:{products:Pick<CatalogProduct,"id"|"name"|"imageUrl"|"priceInCents"|"stock"|"brand">[];selectedId:string|null;version:string}) {
  const router=useRouter(); const [open,setOpen]=useState(false); const [query,setQuery]=useState(""); const [selected,setSelected]=useState(selectedId); const [version,setVersion]=useState(initialVersion); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const current=products.find(p=>p.id===selected);
  const filtered=products.filter(p=>`${p.name} ${p.brand.name}`.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(query.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()));
  async function choose(productId:string|null){
    setBusy(true);setError("");
    try {const res=await fetch("/api/admin/homepage",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"daily",productId,version})});const result=await res.json();if(!res.ok)throw new Error(result.error);setVersion(result.version);setSelected(productId);setOpen(false);router.refresh();}catch(e){setError(e instanceof Error?e.message:"Não foi possível guardar.");}finally{setBusy(false);}
  }
  const button="min-h-10 rounded-xl border border-[color:var(--line)] px-4 py-2 text-sm disabled:opacity-50";
  return <section className="mt-5 rounded-2xl border border-[color:var(--line)] bg-white p-4" aria-label="Perfume do Dia"><h2 className="font-serif text-2xl">Perfume do Dia</h2>
    {current?<div className="mt-3 flex min-w-0 flex-wrap items-center gap-4"><Image src={current.imageUrl||"/logo-9-ilhas.svg"} alt={current.name} width={88} height={100} unoptimized className="h-24 w-20 object-contain"/><div className="min-w-0 flex-1"><strong className="block break-words">{current.name}</strong><p className="text-sm text-slate-500">{current.brand.name}</p><p className="mt-2 flex flex-wrap gap-2"><del className="text-slate-500">{formatPrice(current.priceInCents)}</del><strong>{formatPrice(dailyPerfumePrice(current.priceInCents))}</strong><span className="rounded-full bg-amber-50 px-2 text-sm text-amber-800">-10%</span></p></div></div>:<p className="mt-2 text-sm text-slate-500">Nenhum perfume selecionado</p>}
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} className={button+" bg-[color:var(--atlantic)] text-white"} onClick={()=>{setQuery("");setOpen(true);}}>{current?"Alterar":"Escolher perfume"}</button>{selected?<button type="button" disabled={busy} className={button} onClick={()=>choose(null)}>Desativar</button>:null}</div>
    <p className="mt-2 text-xs text-slate-500">10% sobre o preço base, sem acumular promoções. Mantém-se ativo até alterar ou desativar. Não aplica desconto aos decants.</p>{error?<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>:null}
    {open?<InventoryDialog title="Escolher Perfume do Dia" onClose={()=>{if(!busy)setOpen(false);}}><label className="block text-sm">Pesquisar nome ou marca<input type="search" className="mt-2 h-11 w-full min-w-0 rounded-xl border px-3" value={query} onChange={e=>setQuery(e.target.value)}/></label><p className="my-3 text-xs text-slate-500">{filtered.length} perfumes ativos</p><div className="max-h-[50dvh] space-y-2 overflow-y-auto">{filtered.map(p=><button type="button" disabled={busy} key={p.id} onClick={()=>choose(p.id)} className="flex w-full min-w-0 items-center gap-3 rounded-xl border p-3 text-left disabled:opacity-50"><Image src={p.imageUrl||"/logo-9-ilhas.svg"} alt="" width={48} height={56} unoptimized className="h-14 w-12 shrink-0 object-contain"/><span className="min-w-0 flex-1"><strong className="block break-words text-sm">{p.name}</strong><span className="block text-xs text-slate-500">{p.brand.name} · Stock: {p.stock}</span><span className="text-sm">{formatPrice(p.priceInCents)}</span></span></button>)}</div>{error?<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>:null}</InventoryDialog>:null}
  </section>;
}
