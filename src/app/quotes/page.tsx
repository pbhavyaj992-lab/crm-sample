"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Quote, QuoteStatus, Deal } from "@/lib/types"; import Badge from "@/components/Badge"; import { inr, fmtDate } from "@/lib/format";
const STATUSES: QuoteStatus[] = ["draft", "sent", "accepted", "rejected", "expired"];
const TAX_RATE = 0.18; // 18% GST on the demo quotes
type QuoteRow = Quote & { deals?: { title: string } | null };
export default function QuotesPage() {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]); const [deals, setDeals] = useState<Deal[]>([]);
  const [dealId, setDealId] = useState(""); const [number, setNumber] = useState("");
  const [subtotal, setSubtotal] = useState(""); const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState(""); const [msg, setMsg] = useState("");
  async function load() {
    const { data } = await supabase.from("quotes").select("*,deals(title)").order("created_at", { ascending: false });
    setQuotes((data as QuoteRow[]) ?? []);
    const { data: d } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
    setDeals((d as Deal[]) ?? []);
  }
  useEffect(() => { load(); }, []);
  const sub = Number(subtotal) || 0;
  const tax = Math.round(sub * TAX_RATE);
  const total = sub + tax;
  async function addQuote(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg("Sign in first — quotes are scoped to your tenant."); return; }
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
    const tenant_id = (profile as { tenant_id: string } | null)?.tenant_id;
    if (!tenant_id) { setMsg("No tenant on your profile yet."); return; }
    if (!dealId || !number.trim()) { setMsg("Pick a deal and a quote number."); return; }
    // Total is computed here (subtotal + 18% tax) and re-checked by the
    // database check constraint total_inr = subtotal_inr + tax_inr.
    const { error } = await supabase.from("quotes").insert({ tenant_id, deal_id: dealId, quote_number: number.trim(), status: "draft", subtotal_inr: sub, tax_inr: tax, total_inr: total, valid_until: validUntil || null, notes: notes || null });
    if (error) setMsg(error.message); else { setDealId(""); setNumber(""); setSubtotal(""); setValidUntil(""); setNotes(""); load(); }
  }
  async function setStatus(id: string, status: QuoteStatus) { await supabase.from("quotes").update({ status }).eq("id", id); load(); }
  const acceptedTotal = quotes.filter((q) => q.status === "accepted").reduce((s, q) => s + q.total_inr, 0);
  const sentTotal = quotes.filter((q) => q.status === "sent").reduce((s, q) => s + q.total_inr, 0);
  return (<div><h1 className="text-2xl font-bold">Quotes</h1>
    <p className="mt-1 text-sm text-slate-500">Priced offers against deals. Accepted quotes total <strong>{inr(acceptedTotal)}</strong> · sent quotes awaiting a decision total <strong>{inr(sentTotal)}</strong>. Tax is 18% GST; the total is subtotal + tax.</p>
    <form onSubmit={addQuote} className="mt-4 grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-3">
      <select required value={dealId} onChange={(e) => setDealId(e.target.value)} className="rounded border px-3 py-2 text-sm">
        <option value="">Quote for deal…</option>
        {deals.map((d) => <option key={d.id} value={d.id}>{d.title} ({inr(d.value_inr)})</option>)}
      </select>
      <input required value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Quote number, e.g. Q-2026-004" className="rounded border px-3 py-2 text-sm" />
      <input required value={subtotal} onChange={(e) => setSubtotal(e.target.value)} placeholder="Subtotal (₹)" inputMode="numeric" className="rounded border px-3 py-2 text-sm" />
      <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="rounded border px-3 py-2 text-sm" />
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="rounded border px-3 py-2 text-sm" />
      <p className="flex items-center rounded border bg-slate-50 px-3 py-2 text-sm text-slate-600">Tax (18%): {inr(tax)} · Total: <strong className="ml-1">{inr(total)}</strong></p>
      <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white sm:col-span-3">Create quote</button></form>
    {msg && <p className="mt-2 text-sm text-rose-600">{msg}</p>}
    <div className="mt-4 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm">
      <thead><tr className="border-b text-left text-slate-500"><th className="px-4 py-2">Quote</th><th className="px-4 py-2">Deal</th><th className="px-4 py-2">Subtotal</th><th className="px-4 py-2">Tax</th><th className="px-4 py-2">Total</th><th className="px-4 py-2">Valid until</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Move to</th></tr></thead>
      <tbody>{quotes.map((q) => (<tr key={q.id} className="border-b">
        <td className="px-4 py-2 font-mono text-xs">{q.quote_number}<span className="block font-sans text-xs text-slate-500">{q.notes ?? ""}</span></td>
        <td className="px-4 py-2">{q.deals?.title ?? "—"}</td>
        <td className="px-4 py-2">{inr(q.subtotal_inr)}</td><td className="px-4 py-2">{inr(q.tax_inr)}</td><td className="px-4 py-2 font-bold">{inr(q.total_inr)}</td>
        <td className="px-4 py-2">{fmtDate(q.valid_until)}</td>
        <td className="px-4 py-2"><Badge value={q.status} /></td>
        <td className="px-4 py-2"><select value={q.status} onChange={(e) => setStatus(q.id, e.target.value as QuoteStatus)} className="rounded border px-2 py-1 text-xs">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></td></tr>))}
        {quotes.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">No quotes yet — run supabase/seed.sql, or create one above.</td></tr>}</tbody></table></div>
  </div>);
}
