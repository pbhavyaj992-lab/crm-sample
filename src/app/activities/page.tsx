import { createClient } from "@/lib/supabase/server"; import Badge from "@/components/Badge"; import { fmtDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function ActivitiesPage() {
  const supabase = createClient();
  const { data } = await supabase.from("activities").select("id,kind,subject,body,happened_at").order("happened_at", { ascending: false });
  return (<div><h1 className="text-2xl font-bold">Activities</h1>
    <p className="mt-1 text-sm text-slate-500">Calls, emails, meetings and notes — the timeline for each lead and deal.</p>
    <ul className="mt-4 space-y-2">{(data ?? []).map((a) => (
      <li key={a.id} className="rounded-xl border bg-white p-4 text-sm"><div className="flex justify-between"><span className="font-medium">{a.subject}</span><Badge value={a.kind} /></div>
      <p className="mt-1 text-slate-600">{a.body ?? ""}</p><p className="mt-1 text-xs text-slate-400">{fmtDate(a.happened_at)}</p></li>))}
      {(data ?? []).length === 0 && <li className="rounded-xl border bg-white p-4 text-sm text-slate-500">No activities yet — run supabase/seed.sql.</li>}</ul></div>);
}
