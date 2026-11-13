import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function ContactsPage() {
  const supabase = createClient();
  const { data } = await supabase.from("contacts").select("id,full_name,email,phone,role,created_at").order("created_at", { ascending: false });
  return (<div><h1 className="text-2xl font-bold">Contacts</h1>
    <p className="mt-1 text-sm text-slate-500">People linked to leads and deals. Add contacts from Supabase or extend this page with the same client-side form pattern used on /leads.</p>
    <div className="mt-4 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm">
      <thead><tr className="border-b text-left text-slate-500"><th className="px-4 py-2">Name</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Phone</th></tr></thead>
      <tbody>{(data ?? []).map((c) => (<tr key={c.id} className="border-b"><td className="px-4 py-2 font-medium">{c.full_name}</td><td className="px-4 py-2">{c.role ?? "—"}</td><td className="px-4 py-2">{c.email ?? "—"}</td><td className="px-4 py-2">{c.phone ?? "—"}</td></tr>))}
      {(data ?? []).length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No contacts yet — run supabase/seed.sql.</td></tr>}</tbody></table></div></div>);
}
