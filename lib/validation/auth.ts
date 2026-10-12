import * as z from "zod";

const MIN_CLINIC_NAME_LENGTH = 2;
const MAX_CLINIC_NAME_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 8;
// Supabase Auth hashes passwords with bcrypt, which reads at most 72 bytes,
// and rejects anything longer.
const MAX_PASSWORD_BYTES = 72;

// The database check counts characters, so count code points rather than
// UTF-16 units to keep the form and the constraint in agreement.
const characterCount = (value: string) => Array.from(value).length;
const byteCount = (value: string) => new TextEncoder().encode(value).length;

const clinicName = z
  .string({ error: "Enter your clinic name." })
  .trim()
  .refine((value) => characterCount(value) >= MIN_CLINIC_NAME_LENGTH, {
    error: `Clinic name must be at least ${MIN_CLINIC_NAME_LENGTH} characters.`,
  })
  .refine((value) => characterCount(value) <= MAX_CLINIC_NAME_LENGTH, {
    error: `Clinic name must be ${MAX_CLINIC_NAME_LENGTH} characters or fewer.`,
  });

const email = z
  .string({ error: "Enter a valid email address." })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address." }));

// Spaces can be part of a password, so it is never trimmed.
const newPassword = z
  .string({ error: "Enter a password." })
  .refine((value) => characterCount(value) >= MIN_PASSWORD_LENGTH, {
    error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  })
  .refine((value) => byteCount(value) <= MAX_PASSWORD_BYTES, {
    error: `Password must be ${MAX_PASSWORD_BYTES} characters or fewer.`,
  });

export const registerSchema = z
  .object({
    clinicName,
    email,
    password: newPassword,
    confirmPassword: z.string({ error: "Confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

// Sign-in checks that a password was entered and nothing else, so the form
// never hints at the password policy.
export const loginSchema = z.object({
  email,
  password: z
    .string({ error: "Enter your password." })
    .min(1, { error: "Enter your password." }),
});

export type AuthFormState = {
  errors?: Partial<
    Record<"clinicName" | "email" | "password" | "confirmPassword", string[]>
  >;
  message?: string;
  // React resets a form after its action runs. These are sent back so the
  // form can use them as defaultValue. Passwords are never sent back.
  values?: { clinicName?: string; email?: string };
};
