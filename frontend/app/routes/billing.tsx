import { CreditCard } from "lucide-react";
import { AppShell, Badge, Button, Card, ProtectedRoute, StatusPanel } from "~/components/ui";

export function meta() { return [{ title: "Billing | Collabify" }]; }
export default function Billing() { return <ProtectedRoute><AppShell title="Billing" description="Subscription and campaign-fee placeholders for future monetization experiments."><div className="grid gap-6 md:grid-cols-3"><Card><Badge tone="cyan">Current</Badge><h2 className="mt-4 text-2xl font-black">Starter</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Free MVP access while Collabify validates pricing.</p><Button className="mt-5" type="button"><CreditCard className="h-4 w-4" /> Manage plan</Button></Card><Card className="md:col-span-2"><StatusPanel type="empty" title="No invoices yet" message="Payment records and receipts will appear after billing is enabled." /></Card></div></AppShell></ProtectedRoute>; }
