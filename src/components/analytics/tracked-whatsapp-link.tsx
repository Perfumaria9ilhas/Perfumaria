"use client";

import type { ReactNode } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";

type TrackedWhatsAppLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  contentName?: string;
  target?: string;
};

export function TrackedWhatsAppLink({
  href,
  children,
  className,
  ariaLabel,
  contentName = "WhatsApp",
  target = "_blank",
}: TrackedWhatsAppLinkProps) {
  return (
    <a
      href={href}
      target={target}
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      onClick={() =>
        trackMetaEvent("Contact", {
          content_name: contentName,
          content_type: "contact",
        })
      }
    >
      {children}
    </a>
  );
}
