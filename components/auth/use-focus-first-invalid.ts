import { useEffect, type RefObject } from "react";
import type { AuthFormState } from "@/lib/validation/auth";

// After a failed submit the form resets and focus is left on the submit
// button. Moving it to the first invalid field lets keyboard and screen reader
// users carry on from the error, which the field describes via aria-describedby.
export function useFocusFirstInvalid(
  formRef: RefObject<HTMLFormElement | null>,
  state: AuthFormState,
) {
  useEffect(() => {
    if (!state.errors) {
      return;
    }

    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [formRef, state]);
}
