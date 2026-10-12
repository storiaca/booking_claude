const base =
  "inline-flex h-12 items-center justify-center rounded-full px-6 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-brand text-brand-foreground hover:bg-brand-hover",
  secondary: "border border-border hover:bg-foreground/5",
};

export function buttonClasses(variant: keyof typeof variants) {
  return `${base} ${variants[variant]}`;
}
