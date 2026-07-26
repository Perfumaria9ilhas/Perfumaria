"use client";

import Link from "next/link";
import { MessageCircleMore } from "lucide-react";
import { trackMetaEvent } from "@/lib/meta-pixel";

export function FloatingWhatsApp() {
  return (
    <Link
      href="https://wa.me/351965420948"
      target="_blank"
      onClick={() =>
        trackMetaEvent("Contact", {
          content_name: "WhatsApp",
          content_type: "contact",
        })
      }
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.9rem)] right-3 z-40 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,_#c79655,_#a76c34)] px-3 py-2 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(96,63,31,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_18px_30px_rgba(96,63,31,0.28)] md:bottom-5 md:right-5 md:gap-2.5 md:px-4 md:py-2.5"
      aria-label="Fale connosco no WhatsApp"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/18">
        <MessageCircleMore className="h-4 w-4" />
      </span>
      <span className="hidden md:inline">Fale Connosco</span>
    </Link>
  );
}
