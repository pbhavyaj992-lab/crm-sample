import "./globals.css";
import type { ReactNode } from "react";
const nav = [["Dashboard", "/"], ["Leads", "/leads"], ["Deals", "/deals"], ["Conversions", "/conversions"], ["Quotes", "/quotes"], ["Contacts", "/contacts"], ["Activities", "/activities"], ["Tasks", "/tasks"]];
export const metadata = { title: "CRM Sample — Demo", description: "Multi-tenant CRM sample built with Next.js and Supabase. Demo data only." };
export default function RootLayout({ children }: { children: ReactNode }) {
  return (<html lang="en"><body>
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 bg-slate-900 p-4 text-white">
        <p className="text-lg font-bold">CRM Sample</p>
        <p className="mt-0.5 text-xs text-slate-400">Demo workspace · fictional data</p>
        <nav className="mt-6 space-y-1">{nav.map(([label, href]) => (
          <a key={href} href={href} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-800">{label}</a>))}</nav>
        <p className="mt-8 text-xs leading-relaxed text-slate-400">Multi-tenant: every record belongs to one tenant. Row Level Security enforces isolation in Supabase.</p>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div></body></html>);
}
