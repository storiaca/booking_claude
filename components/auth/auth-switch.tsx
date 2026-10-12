import Link from "next/link";

export function AuthSwitch({
  prompt,
  href,
  action,
}: {
  prompt: string;
  href: string;
  action: string;
}) {
  return (
    <p className="mt-8 text-center text-sm text-muted-foreground">
      {prompt}{" "}
      <Link
        href={href}
        className="rounded-sm font-medium text-brand underline underline-offset-4 transition-colors hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {action}
      </Link>
    </p>
  );
}
