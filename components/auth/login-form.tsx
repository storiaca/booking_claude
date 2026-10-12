"use client";

import { useActionState, useRef } from "react";
import { login } from "@/app/actions/auth";
import { useFocusFirstInvalid } from "@/components/auth/use-focus-first-invalid";
import { buttonClasses } from "@/components/ui/button";
import { FormField, FormMessage } from "@/components/ui/form-field";
import type { AuthFormState } from "@/lib/validation/auth";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstInvalid(formRef, state);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex w-full flex-col gap-6"
    >
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.errors?.email?.[0]}
      />
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={state.errors?.password?.[0]}
      />
      <FormMessage message={pending ? undefined : state.message} />
      <button
        type="submit"
        disabled={pending}
        className={`${buttonClasses("primary")} mt-2 w-full`}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
