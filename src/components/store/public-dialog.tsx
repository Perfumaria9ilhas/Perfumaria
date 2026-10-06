"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, type ReactNode } from "react";

/** Portals keep fixed surfaces out of the sticky header's stacking context. */
export function PublicDialog({ open, onClose, title, children, className = "", hideTitle = false }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string; hideTitle?: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) contentRef.current?.scrollTo({ top: 0 }); }, [open, title]);
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="store-overlay" />
      <Dialog.Content ref={contentRef} aria-describedby={undefined} className={`store-surface ${className}`}>
        <Dialog.Title className={hideTitle ? "sr-only" : "store-dialog-title"}>{title}</Dialog.Title>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
