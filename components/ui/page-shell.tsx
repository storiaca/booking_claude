import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/site";

// Frame shared by the register, sign-in and dashboard pages. It uses the same
// gutters, vertical padding and eyebrow / heading rhythm as the hero.
export function PageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24 sm:py-32">
      <div className="flex w-full max-w-md flex-col items-center">
        <Link
          href="/"
          className="rounded-sm text-sm font-semibold tracking-wide text-brand transition-colors hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {SITE_NAME}
        </Link>
        <h1 className="mt-4 text-center text-3xl font-semibold tracking-tight text-balance break-words">
          {title}
        </h1>
        {children}
      </div>
    </main>
  );
}
