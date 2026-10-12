"use client";

import { useActionState, useRef } from "react";
import { register } from "@/app/actions/auth";
import { useFocusFirstInvalid } from "@/components/auth/use-focus-first-invalid";
import { buttonClasses } from "@/components/ui/button";
import { FormField, FormMessage } from "@/components/ui/form-field";
import type { AuthFormState } from "@/lib/validation/auth";

const initialState: AuthFormState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstInvalid(formRef, state);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex w-full flex-col gap-6"
    >
      <FormField
        name="clinicName"
        label="Clinic name"
        autoComplete="organization"
        required
        minLength={2}
        maxLength={100}
        defaultValue={state.values?.clinicName}
        error={state.errors?.clinicName?.[0]}
      />
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
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters"
        error={state.errors?.password?.[0]}
      />
      <FormField
        name="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        error={state.errors?.confirmPassword?.[0]}
      />
      <FormMessage message={pending ? undefined : state.message} />
      <button
        type="submit"
        disabled={pending}
        className={`${buttonClasses("primary")} mt-2 w-full`}
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
