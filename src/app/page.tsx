import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard"; import Badge from "@/components/Badge"; import { inr, fmtDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function Dashboard() {
  const supabase = createClient();
  const [leads, deals, tasks, conversions, quotes] = await Promise.all([
    supabase.from("leads").select("id,status,value_inr,full_name,company,created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("deals").select("id,title,stage,value_inr,expected_close").order("created_at", { ascending: false }).limit(5),
    supabase.from("tasks").select("id,title,due_date,done").eq("done", false).order("due_date").limit(5),
    supabase.from("conversions").select("id,converted_at").order("converted_at", { ascending: false }).limit(5),
    supabase.from("quotes").select("id,quote_number,status,total_inr").eq("status", "accepted"),
  ]);
  const pipeline = (deals.data ?? []).reduce((s, d) => s + (d.value_inr ?? 0), 0);
  const acceptedQuotes = (quotes.data ?? []).reduce((s, q) => s + (q.total_inr ?? 0), 0);
  const openLeads = (leads.data ?? []).filter((l) => l.status !== "lost").length;
  return (<div>
    <h1 className="text-2xl font-bold">Sales dashboard</h1>
    <p className="mt-1 text-sm text-slate-500">Demo data for Acme Demo Traders (fictional). No real customers.</p>
    <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
      <StatCard label="Open leads (shown)" value={String(openLeads)} sub="Latest 5 queried" />
      <StatCard label="Pipeline value" value={inr(pipeline)} sub="Deals shown below" />
      <StatCard label="Open tasks" value={String((tasks.data ?? []).length)} sub="Due soonest first" />
      <StatCard label="Deals" value={String((deals.data ?? []).length)} sub="Latest 5" />
      <StatCard label="Lead conversions" value={String((conversions.data ?? []).length)} sub="Latest 5 converted" />
      <StatCard label="Accepted quotes" value={inr(acceptedQuotes)} sub="Quoted value won" />
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border bg-white p-4"><h2 className="font-semibold">Latest leads</h2>
        <ul className="mt-3 space-y-2">{(leads.data ?? []).map((l) => (
          <li key={l.id} className="flex items-center justify-between border-b pb-2 text-sm"><span>{l.full_name} <span className="text-slate-500">· {l.company ?? "—"}</span></span><Badge value={l.status} /></li>))}
          {(leads.data ?? []).length === 0 && <li className="text-sm text-slate-500">No leads yet — run supabase/seed.sql, or add one from /leads.</li>}</ul></section>
      <section className="rounded-xl border bg-white p-4"><h2 className="font-semibold">Latest deals</h2>
        <ul className="mt-3 space-y-2">{(deals.data ?? []).map((d) => (
          <li key={d.id} className="flex items-center justify-between border-b pb-2 text-sm"><span>{d.title}</span><span>{inr(d.value_inr)} · {fmtDate(d.expected_close)}</span></li>))}
          {(deals.data ?? []).length === 0 && <li className="text-sm text-slate-500">No deals yet — run supabase/seed.sql, or add one from /deals.</li>}</ul></section>
    </div>
    <section className="mt-6 rounded-xl border bg-white p-4"><h2 className="font-semibold">Open tasks</h2>
      <ul className="mt-3 space-y-2">{(tasks.data ?? []).map((t) => (
        <li key={t.id} className="flex justify-between text-sm"><span>{t.title}</span><span className="text-slate-500">Due {fmtDate(t.due_date)}</span></li>))}
        {(tasks.data ?? []).length === 0 && <li className="text-sm text-slate-500">No open tasks.</li>}</ul></section>
  </div>);
}
