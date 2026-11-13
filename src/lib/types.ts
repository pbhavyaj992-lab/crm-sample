export type Tenant = { id: string; name: string; slug: string; created_at: string };
export type LeadStatus = "new" | "contacted" | "qualified" | "lost";
export type Lead = { id: string; tenant_id: string; full_name: string; email: string | null; phone: string | null; company: string | null; source: string | null; status: LeadStatus; value_inr: number; notes: string | null; created_at: string };
export type Contact = { id: string; tenant_id: string; lead_id: string | null; full_name: string; email: string | null; phone: string | null; role: string | null; created_at: string };
export type DealStage = "discovery" | "proposal" | "negotiation" | "won" | "lost";
export type Deal = { id: string; tenant_id: string; title: string; contact_id: string | null; stage: DealStage; value_inr: number; expected_close: string | null; created_at: string };
export type Activity = { id: string; tenant_id: string; kind: "call" | "email" | "meeting" | "note"; subject: string; body: string | null; lead_id: string | null; deal_id: string | null; happened_at: string };
export type TaskItem = { id: string; tenant_id: string; title: string; due_date: string | null; done: boolean; lead_id: string | null; deal_id: string | null; created_at: string };
export type Conversion = { id: string; tenant_id: string; lead_id: string; contact_id: string | null; deal_id: string | null; notes: string | null; converted_at: string };
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export type Quote = { id: string; tenant_id: string; deal_id: string; quote_number: string; status: QuoteStatus; subtotal_inr: number; tax_inr: number; total_inr: number; valid_until: string | null; notes: string | null; created_at: string };
// One user belongs to exactly one tenant (profiles.tenant_id). Every row
// carries tenant_id and RLS enforces tenant_id = current user's tenant.
