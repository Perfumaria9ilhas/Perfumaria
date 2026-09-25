import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  compact = false,
  href = "/",
  className,
}: {
  compact?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center justify-center", className)}>
      <div
        className={cn(
          "relative mx-auto",
          compact
            ? "h-12 w-[clamp(7rem,39vw,9.5rem)]"
            : "h-16 w-[min(236px,100%)] lg:h-[4.5rem] lg:w-[16.75rem]",
        )}
      >
        <Image
          src="/logo-9-ilhas.svg"
          alt="9 Ilhas Perfumaria"
          fill
          priority
          className="object-contain object-center"
        />
      </div>
    </Link>
  );
}
