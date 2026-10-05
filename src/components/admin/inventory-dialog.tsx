"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function InventoryDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/40" />
      <Dialog.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-[101] max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-[color:var(--line)] bg-white p-4 shadow-xl focus:outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%_-_2rem)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3"><Dialog.Title className="font-serif text-2xl">{title}</Dialog.Title><Dialog.Close aria-label="Fechar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"><X size={18} /></Dialog.Close></div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
