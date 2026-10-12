import type { Metadata } from "next";
import { logout } from "@/app/actions/auth";
import { buttonClasses } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { getClinic, verifySession } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default async function DashboardPage() {
  const { email } = await verifySession();
  const clinic = await getClinic();

  return (
    <PageShell title={clinic.name}>
      <div className="mt-6 flex flex-col items-center gap-2 text-center text-base leading-7 text-muted-foreground">
        {email ? <p className="break-words">Signed in as {email}</p> : null}
        <p>Your dashboard is coming soon.</p>
      </div>
      <form action={logout} className="mt-10 w-full sm:w-auto">
        <button
          type="submit"
          className={`${buttonClasses("secondary")} w-full sm:w-auto`}
        >
          Sign out
        </button>
      </form>
    </PageShell>
  );
}
