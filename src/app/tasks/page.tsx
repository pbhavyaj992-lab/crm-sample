"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TaskItem } from "@/lib/types"; import { fmtDate } from "@/lib/format";
export default function TasksPage() {
  const supabase = createClient(); const [tasks, setTasks] = useState<TaskItem[]>([]); const [title, setTitle] = useState(""); const [due, setDue] = useState("");
  async function load() { const { data } = await supabase.from("tasks").select("*").order("due_date"); setTasks((data as TaskItem[]) ?? []); }
  useEffect(() => { load(); }, []);
  async function toggle(t: TaskItem) { await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id); load(); }
  async function add(e: React.FormEvent) { e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
    const tenant_id = (profile as { tenant_id: string } | null)?.tenant_id; if (!tenant_id) return;
    await supabase.from("tasks").insert({ tenant_id, title, due_date: due || null }); setTitle(""); setDue(""); load(); }
  return (<div><h1 className="text-2xl font-bold">Tasks</h1>
    <form onSubmit={add} className="mt-4 flex gap-2 rounded-xl border bg-white p-4">
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Follow up with…" className="flex-1 rounded border px-3 py-2 text-sm" />
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="rounded border px-3 py-2 text-sm" />
      <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Add task</button></form>
    <ul className="mt-4 space-y-2">{tasks.map((t) => (
      <li key={t.id} className="flex items-center justify-between rounded-xl border bg-white p-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={t.done} onChange={() => toggle(t)} />
        <span className={t.done ? "line-through text-slate-400" : ""}>{t.title}</span></label>
        <span className="text-slate-500">Due {fmtDate(t.due_date)}</span></li>))}
      {tasks.length === 0 && <li className="rounded-xl border bg-white p-4 text-sm text-slate-500">No tasks yet.</li>}</ul></div>);
}
