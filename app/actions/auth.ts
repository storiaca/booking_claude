"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  type AuthFormState,
} from "@/lib/validation/auth";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const EXISTING_ACCOUNT = "An account with this email already exists.";
const RATE_LIMITED = "Too many attempts. Try again in a few minutes.";

// Keyed by Supabase Auth error code. Raw Supabase messages are never shown.
const ERROR_MESSAGES = new Map([
  ["user_already_exists", EXISTING_ACCOUNT],
  ["email_exists", EXISTING_ACCOUNT],
  ["invalid_credentials", "Invalid email or password."],
  ["email_not_confirmed", "Confirm your email before signing in."],
  ["weak_password", "Password must be at least 8 characters."],
  ["email_address_invalid", "Enter a valid email address."],
  ["over_request_rate_limit", RATE_LIMITED],
  ["over_email_send_rate_limit", RATE_LIMITED],
]);

function messageFor(code: string | undefined) {
  return (code && ERROR_MESSAGES.get(code)) || GENERIC_ERROR;
}

function textField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function register(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = {
    clinicName: textField(formData, "clinicName"),
    email: textField(formData, "email"),
  };

  const parsed = registerSchema.safeParse({
    clinicName: formData.get("clinicName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { clinicName, email, password } = parsed.data;
  const supabase = await createClient();

  // The clinic row is created by a database trigger from clinic_name, in the
  // same transaction as the user.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { clinic_name: clinicName } },
  });

  if (error) {
    return { message: messageFor(error.code), values };
  }

  // No session means email confirmation is switched on for the project.
  if (!data.session) {
    return {
      message: "Check your inbox to confirm your email, then sign in.",
      values,
    };
  }

  redirect("/dashboard");
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = { email: textField(formData, "email") };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { message: messageFor(error.code), values };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();

  // Local scope keeps the clinic's other devices signed in.
  await supabase.auth.signOut({ scope: "local" });

  redirect("/login");
}
