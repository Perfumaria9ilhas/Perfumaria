"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InventoryDialog } from "./inventory-dialog";
import { formatPrice } from "@/lib/format";
import { dailyPerfumePrice } from "@/lib/daily-perfume";
import type { CatalogProduct } from "@/lib/types";

export function DailyPerfumeCard({products,selectedId,version:initialVersion}:{products:Pick<CatalogProduct,"id"|"name"|"imageUrl"|"priceInCents"|"stock"|"brand">[];selectedId:string|null;version:string}) {
  const router=useRouter(); const [open,setOpen]=useState(false); const [query,setQuery]=useState(""); const [selected,setSelected]=useState(selectedId); const [version,setVersion]=useState(initialVersion); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const lock = useRef(false);
  const current=products.find(p=>p.id===selected);
  const filtered=products.filter(p=>`${p.name} ${p.brand.name}`.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(query.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()));
  async function choose(productId:string|null){
    if (lock.current) return; lock.current = true;
    setBusy(true);setError("");
    try {const res=await fetch("/api/admin/homepage",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"daily",productId,version})});const result=await res.json();if(!res.ok)throw new Error(result.error);setVersion(result.version);setSelected(productId);setOpen(false);router.refresh();}catch(e){setError(e instanceof Error?e.message:"Não foi possível guardar.");}finally{lock.current=false;setBusy(false);}
  }
  const button="min-h-10 rounded-xl border border-[color:var(--line)] px-4 py-2 text-sm disabled:opacity-50";
  return <section className="daily-compact mt-4 rounded-2xl border border-[color:var(--line)] bg-white p-3" aria-label="Perfume do Dia">
    <button type="button" disabled={busy} onClick={()=>{setQuery("");setOpen(true);}} className="flex min-h-14 w-full min-w-0 items-center gap-3 text-left">
      {current ? <Image src={current.imageUrl||"/logo-9-ilhas.svg"} alt="" width={44} height={56} unoptimized className="h-14 w-11 shrink-0 object-contain"/> : null}
      <span className="min-w-0 flex-1"><span className="block text-xs text-slate-500">Perfume do Dia</span><strong className="block truncate text-sm">{current ? current.name : "Escolher perfume"}</strong>{current ? <span className="flex flex-wrap gap-2 text-xs"><del className="text-slate-500">{formatPrice(current.priceInCents)}</del><strong>{formatPrice(dailyPerfumePrice(current.priceInCents))}</strong></span> : null}</span>
      <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">{current ? "Ativo -10%" : "+ Escolher"}</span>
    </button>
    {error?<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>:null}
    {open?<InventoryDialog title="Escolher Perfume do Dia" onClose={()=>{if(!busy)setOpen(false);}}><label className="block text-sm">Pesquisar nome ou marca<input type="search" className="mt-2 h-11 w-full min-w-0 rounded-xl border px-3" value={query} onChange={e=>setQuery(e.target.value)}/></label><p className="my-3 text-xs text-slate-500">10% sobre o preço base, sem acumular promoções ou descontar decants.</p>{selected ? <button type="button" disabled={busy} className={button+" mb-3 w-full text-red-700"} onClick={()=>choose(null)}>Desativar promoção</button> : null}<div className="max-h-[50dvh] space-y-2 overflow-y-auto">{filtered.map(p=><button type="button" disabled={busy} key={p.id} onClick={()=>choose(p.id)} className="flex w-full min-w-0 items-center gap-3 rounded-xl border p-3 text-left disabled:opacity-50"><Image src={p.imageUrl||"/logo-9-ilhas.svg"} alt="" width={48} height={56} unoptimized className="h-14 w-12 shrink-0 object-contain"/><span className="min-w-0 flex-1"><strong className="block break-words text-sm">{p.name}</strong><span className="block text-xs text-slate-500">{p.brand.name} · Stock: {p.stock}</span><span className="text-sm">{formatPrice(p.priceInCents)}</span></span></button>)}</div>{error?<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>:null}</InventoryDialog>:null}
  </section>;
}
