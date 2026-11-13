"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Deal, DealStage } from "@/lib/types"; import { inr, fmtDate } from "@/lib/format";
const STAGES: DealStage[] = ["discovery", "proposal", "negotiation", "won", "lost"];
export default function DealsPage() {
  const supabase = createClient(); const [deals, setDeals] = useState<Deal[]>([]);
  const [title, setTitle] = useState(""); const [value, setValue] = useState(""); const [msg, setMsg] = useState("");
  async function load() { const { data } = await supabase.from("deals").select("*").order("created_at", { ascending: false }); setDeals((data as Deal[]) ?? []); }
  useEffect(() => { load(); }, []);
  async function addDeal(e: React.FormEvent) { e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser(); if (!user) { setMsg("Sign in first."); return; }
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
    const tenant_id = (profile as { tenant_id: string } | null)?.tenant_id; if (!tenant_id) { setMsg("No tenant on your profile yet."); return; }
    const { error } = await supabase.from("deals").insert({ tenant_id, title, value_inr: Number(value) || 0, stage: "discovery" });
    if (error) setMsg(error.message); else { setTitle(""); setValue(""); load(); } }
  async function move(id: string, stage: DealStage) { await supabase.from("deals").update({ stage }).eq("id", id); load(); }
  const total = deals.filter((d) => d.stage !== "lost").reduce((s, d) => s + d.value_inr, 0);
  return (<div><h1 className="text-2xl font-bold">Deals pipeline</h1>
    <p className="mt-1 text-sm text-slate-500">Open pipeline value: <strong>{inr(total)}</strong> (won + lost excluded from the lost total only; won deals count as closed).</p>
    <form onSubmit={addDeal} className="mt-4 flex gap-2 rounded-xl border bg-white p-4">
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deal title, e.g. Website redesign — Demo Traders" className="flex-1 rounded border px-3 py-2 text-sm" />
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value (₹)" inputMode="numeric" className="w-32 rounded border px-3 py-2 text-sm" />
      <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Add deal</button></form>
    {msg && <p className="mt-2 text-sm text-rose-600">{msg}</p>}
    <div className="mt-4 grid gap-4 md:grid-cols-5">{STAGES.map((stage) => (
      <section key={stage} className="rounded-xl border bg-white p-3"><h2 className="text-sm font-semibold capitalize">{stage}</h2>
        <p className="text-xs text-slate-500">{inr(deals.filter((d) => d.stage === stage).reduce((s, d) => s + d.value_inr, 0))}</p>
        <div className="mt-3 space-y-2">{deals.filter((d) => d.stage === stage).map((d) => (
          <div key={d.id} className="rounded-lg border p-2 text-sm"><p className="font-medium">{d.title}</p>
            <p className="text-xs text-slate-500">{inr(d.value_inr)} · close {fmtDate(d.expected_close)}</p>
            <select value={d.stage} onChange={(e) => move(d.id, e.target.value as DealStage)} className="mt-2 w-full rounded border px-2 py-1 text-xs">
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>))}
          {deals.filter((d) => d.stage === stage).length === 0 && <p className="text-xs text-slate-400">Empty</p>}</div></section>))}</div>
  </div>);
}
