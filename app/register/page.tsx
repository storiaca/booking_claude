import type { Metadata } from "next";
import { AuthSwitch } from "@/components/auth/auth-switch";
import { RegisterForm } from "@/components/auth/register-form";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = {
  title: "Register your clinic",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <PageShell title="Register your clinic">
      <div className="mt-10 w-full">
        <RegisterForm />
      </div>
      <AuthSwitch
        prompt="Already have an account?"
        href="/login"
        action="Sign in"
      />
    </PageShell>
  );
}
