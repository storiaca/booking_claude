import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Register your clinic",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="flex max-w-md flex-col items-center text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Register your clinic
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          The registration form is coming soon.
        </p>
        <Link
          href="/"
          className="mt-8 text-sm font-medium text-brand hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
