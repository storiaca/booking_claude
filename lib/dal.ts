import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Every protected page and Server Action calls this itself. The proxy and
// layouts are not the security boundary.
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  return { userId: data.claims.sub, email: data.claims.email };
});

export const getClinic = cache(async () => {
  const { userId } = await verifySession();
  const supabase = await createClient();

  // Row Level Security applies the same owner filter in the database.
  const { data, error } = await supabase
    .from("clinics")
    .select("id, name")
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  // A trigger creates the clinic with the account, so a missing row is a
  // data problem. Redirecting to /login would loop: the proxy sends signed-in
  // visitors straight back to the dashboard.
  if (!data) {
    throw new Error("The signed-in account has no clinic.");
  }

  return data;
});
