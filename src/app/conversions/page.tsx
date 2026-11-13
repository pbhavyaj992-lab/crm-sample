"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversion, Lead, Contact, Deal } from "@/lib/types"; import { fmtDate } from "@/lib/format";

type ConversionRow = Conversion & { leads?: { full_name: string; company: string | null } | null; contacts?: { full_name: string } | null; deals?: { title: string } | null };

async function tenantId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  return (profile as { tenant_id: string } | null)?.tenant_id ?? null;
}

export default function ConversionsPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<ConversionRow[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leadId, setLeadId] = useState(""); const [contactId, setContactId] = useState("");
  const [dealId, setDealId] = useState(""); const [notes, setNotes] = useState(""); const [msg, setMsg] = useState("");
  async function load() {
    const { data } = await supabase.from("conversions").select("*,leads(full_name,company),contacts(full_name),deals(title)").order("converted_at", { ascending: false });
    setRows((data as ConversionRow[]) ?? []);
    const [l, c, d] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("contacts").select("*").order("created_at", { ascending: false }),
      supabase.from("deals").select("*").order("created_at", { ascending: false }),
    ]);
    setLeads((l.data as Lead[]) ?? []); setContacts((c.data as Contact[]) ?? []); setDeals((d.data as Deal[]) ?? []);
  }
  useEffect(() => { load(); }, []);
  // Leads already converted are excluded: one lead converts at most once.
  const convertedLeadIds = new Set(rows.map((r) => r.lead_id));
  const convertible = leads.filter((l) => l.status !== "lost" && !convertedLeadIds.has(l.id));
  async function convert(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const tid = await tenantId(supabase);
    if (!tid) { setMsg("Sign in first — conversions are scoped to your tenant."); return; }
    if (!leadId) { setMsg("Pick a lead to convert."); return; }
    const { error } = await supabase.from("conversions").insert({ tenant_id: tid, lead_id: leadId, contact_id: contactId || null, deal_id: dealId || null, notes: notes || null });
    if (error) { setMsg(error.message); return; }
    // The lead is now a customer record: mark it qualified so the pipeline agrees.
    await supabase.from("leads").update({ status: "qualified" }).eq("id", leadId);
    setLeadId(""); setContactId(""); setDealId(""); setNotes(""); load();
  }
  return (<div><h1 className="text-2xl font-bold">Lead conversions</h1>
    <p className="mt-1 text-sm text-slate-500">One row per lead that became a contact and/or a deal. A lead converts once — converting again is blocked by the database, not just the form.</p>
    <form onSubmit={convert} className="mt-4 grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-2">
      <select required value={leadId} onChange={(e) => setLeadId(e.target.value)} className="rounded border px-3 py-2 text-sm">
        <option value="">Convert lead…</option>
        {convertible.map((l) => <option key={l.id} value={l.id}>{l.full_name} · {l.company ?? "—"} ({l.status})</option>)}
      </select>
      <select value={contactId} onChange={(e) => setContactId(e.target.value)} className="rounded border px-3 py-2 text-sm">
        <option value="">Link contact (optional)</option>
        {contacts.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
      </select>
      <select value={dealId} onChange={(e) => setDealId(e.target.value)} className="rounded border px-3 py-2 text-sm">
        <option value="">Link deal (optional)</option>
        {deals.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
      </select>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes, e.g. Budget approved" className="rounded border px-3 py-2 text-sm" />
      <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white sm:col-span-2">Record conversion</button></form>
    {msg && <p className="mt-2 text-sm text-rose-600">{msg}</p>}
    {convertible.length === 0 && <p className="mt-2 text-sm text-slate-500">No convertible leads right now — add one from /leads, or every open lead is already converted.</p>}
    <div className="mt-4 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm">
      <thead><tr className="border-b text-left text-slate-500"><th className="px-4 py-2">Lead</th><th className="px-4 py-2">Became contact</th><th className="px-4 py-2">Became deal</th><th className="px-4 py-2">Converted</th><th className="px-4 py-2">Notes</th></tr></thead>
      <tbody>{rows.map((r) => (<tr key={r.id} className="border-b">
        <td className="px-4 py-2 font-medium">{r.leads?.full_name ?? r.lead_id}<span className="block text-xs text-slate-500">{r.leads?.company ?? ""}</span></td>
        <td className="px-4 py-2">{r.contacts?.full_name ?? "—"}</td>
        <td className="px-4 py-2">{r.deals?.title ?? "—"}</td>
        <td className="px-4 py-2">{fmtDate(r.converted_at)}</td>
        <td className="px-4 py-2">{r.notes ?? "—"}</td></tr>))}
        {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No conversions yet — run supabase/seed.sql, or convert a lead above.</td></tr>}</tbody></table></div>
  </div>);
}
