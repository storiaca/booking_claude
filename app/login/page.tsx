import type { Metadata } from "next";
import { AuthSwitch } from "@/components/auth/auth-switch";
import { LoginForm } from "@/components/auth/login-form";
import { PageShell } from "@/components/ui/page-shell";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Clinic sign in",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <PageShell title="Clinic sign in">
      <div className="mt-10 w-full">
        <LoginForm />
      </div>
      <AuthSwitch
        prompt={`New to ${SITE_NAME}?`}
        href="/register"
        action="Register your clinic"
      />
    </PageShell>
  );
}
