import Link from "next/link";
import { MessageCircleMore } from "lucide-react";

export function FloatingWhatsApp() {
  return (
    <Link
      href="https://wa.me/351965420948"
      target="_blank"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 rounded-full bg-[linear-gradient(135deg,_#c79655,_#a76c34)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(96,63,31,0.24)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_36px_rgba(96,63,31,0.3)]"
      aria-label="Fale connosco no WhatsApp"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/18">
        <MessageCircleMore className="h-4 w-4" />
      </span>
      <span>Fale Connosco</span>
    </Link>
  );
}
