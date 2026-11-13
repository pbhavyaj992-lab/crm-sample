// Resolve the signed-in user's tenant. Server components call this after
// auth; if there is no session it returns null and pages show the demo
// sign-in prompt instead of leaking another tenant's rows.
import { createClient } from "./supabase/server";
export async function getCurrentTenantId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  return (data as { tenant_id: string } | null)?.tenant_id ?? null;
}
