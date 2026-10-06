function InstagramIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.9"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.1" /><circle cx="17.4" cy="6.7" r="1" className="fill-current stroke-none" /></svg>;
}

function FacebookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M13.7 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5H17V3.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.5V13h2.8v8h3.4Z" /></svg>;
}

function TikTokIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M15.3 3c.3 2 1.5 3.3 3.7 3.5v3.1a8.5 8.5 0 0 1-3.7-1.1v6.3a6 6 0 1 1-5.2-5.9v3.2a2.8 2.8 0 1 0 2 2.7V3h3.2Z" /></svg>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M12 2a9.8 9.8 0 0 0-8.5 14.7L2.2 22l5.4-1.3A10 10 0 1 0 12 2Zm0 17.9a8 8 0 0 1-4.1-1.1l-.3-.2-3.2.8.9-3.1-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.3 0-.4.1-.5l.4-.5.2-.4c.1-.2 0-.4 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.3 2.4.8 2.9.6 3.4.6.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.2-.3-.2-.5-.3Z" /></svg>;
}

export function SocialIcon({ label }: { label: string }) {
  if (label === "Instagram") return <InstagramIcon />;
  if (label === "Facebook") return <FacebookIcon />;
  if (label === "TikTok") return <TikTokIcon />;
  return <WhatsAppIcon />;
}

export function socialIconClass(label: string) {
  if (label === "Facebook") return "border-[#3b5998] bg-[#3b5998] text-white hover:border-[#2f477c] hover:bg-[#2f477c]";
  if (label === "Instagram") return "border-[#8a4b35] bg-[#8a4b35] text-white hover:border-[#713b2b] hover:bg-[#713b2b]";
  if (label === "TikTok") return "border-black bg-black text-white hover:border-[#242424] hover:bg-[#242424]";
  return "border-[#2f8f63] bg-[#2f8f63] text-white hover:border-[#267552] hover:bg-[#267552]";
}
