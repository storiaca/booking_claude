import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const buttonBase =
  "inline-flex h-12 items-center justify-center rounded-full px-6 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function Hero() {
  return (
    <section className="flex flex-1 items-center justify-center px-6 py-24 sm:py-32">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="text-sm font-semibold tracking-wide text-brand">
          {SITE_NAME}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Online booking for your dental clinic
        </h1>
        <p className="mt-6 text-lg leading-8 text-pretty text-muted-foreground">
          Publish your availability, share one booking link, and let patients
          request appointments without creating an account. You approve every
          request and stay in control of your calendar.
        </p>
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/register"
            className={`${buttonBase} bg-brand text-brand-foreground hover:bg-brand-hover`}
          >
            Register your clinic
          </Link>
          <Link
            href="/login"
            className={`${buttonBase} border border-border hover:bg-foreground/5`}
          >
            Clinic sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
