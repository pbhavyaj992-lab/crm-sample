"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Lead } from "@/lib/types"; import Badge from "@/components/Badge"; import { inr } from "@/lib/format";
const STATUSES = ["new", "contacted", "qualified", "lost"] as const;
export default function LeadsPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]); const [filter, setFilter] = useState("all");
  const [name, setName] = useState(""); const [company, setCompany] = useState(""); const [email, setEmail] = useState("");
  const [value, setValue] = useState(""); const [msg, setMsg] = useState("");
  async function load() { const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false }); setLeads((data as Lead[]) ?? []); }
  useEffect(() => { load(); }, []);
  async function addLead(e: React.FormEvent) { e.preventDefault(); setMsg("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg("Sign in first — leads are scoped to your tenant."); return; }
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
    const tenant_id = (profile as { tenant_id: string } | null)?.tenant_id;
    if (!tenant_id) { setMsg("No tenant on your profile yet. Create one in Supabase (tenants + profiles) first."); return; }
    const { error } = await supabase.from("leads").insert({ tenant_id, full_name: name, company: company || null, email: email || null, value_inr: Number(value) || 0, status: "new" });
    if (error) setMsg(error.message); else { setName(""); setCompany(""); setEmail(""); setValue(""); load(); } }
  async function setStatus(id: string, status: string) { await supabase.from("leads").update({ status }).eq("id", id); load(); }
  const shown = filter === "all" ? leads : leads.filter((l) => l.status === filter);
  return (<div><h1 className="text-2xl font-bold">Leads</h1>
    <p className="mt-1 text-sm text-slate-500">Capture, qualify and convert. Status changes write straight to Supabase. To record a lead becoming a contact/deal, use <a href="/conversions" className="text-blue-700 underline">Conversions</a>.</p>
    <div className="mt-4 flex gap-2">{["all", ...STATUSES].map((s) => (
      <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-sm ${filter === s ? "bg-slate-900 text-white" : "bg-white border"}`}>{s}</button>))}</div>
    <form onSubmit={addLead} className="mt-4 grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-5">
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="rounded border px-3 py-2 text-sm" />
      <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className="rounded border px-3 py-2 text-sm" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded border px-3 py-2 text-sm" />
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value (₹)" inputMode="numeric" className="rounded border px-3 py-2 text-sm" />
      <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Add lead</button></form>
    {msg && <p className="mt-2 text-sm text-rose-600">{msg}</p>}
    <div className="mt-4 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm">
      <thead><tr className="border-b text-left text-slate-500"><th className="px-4 py-2">Name</th><th className="px-4 py-2">Company</th><th className="px-4 py-2">Value</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Move to</th></tr></thead>
      <tbody>{shown.map((l) => (<tr key={l.id} className="border-b">
        <td className="px-4 py-2 font-medium">{l.full_name}<span className="block text-xs text-slate-500">{l.email ?? "—"}</span></td>
        <td className="px-4 py-2">{l.company ?? "—"}</td><td className="px-4 py-2">{inr(l.value_inr)}</td>
        <td className="px-4 py-2"><Badge value={l.status} /></td>
        <td className="px-4 py-2"><select value={l.status} onChange={(e) => setStatus(l.id, e.target.value)} className="rounded border px-2 py-1 text-xs">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></td></tr>))}
        {shown.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No leads in this view yet.</td></tr>}</tbody></table></div>
  </div>);
}
