import type { ComponentProps } from "react";

type FormFieldProps = Omit<
  ComponentProps<"input">,
  "id" | "className" | "aria-invalid" | "aria-describedby"
> & {
  name: string;
  label: string;
  hint?: string;
  error?: string;
};

export function FormField({
  name,
  label,
  hint,
  error,
  ...inputProps
}: FormFieldProps) {
  const messageId = `${name}-message`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        {...inputProps}
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className="h-12 w-full rounded-full border border-foreground/50 px-5 text-base transition-colors placeholder:text-muted-foreground hover:border-foreground/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand aria-invalid:border-destructive"
      />
      {message ? (
        <p
          id={messageId}
          className={`text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </p>
  );
}
