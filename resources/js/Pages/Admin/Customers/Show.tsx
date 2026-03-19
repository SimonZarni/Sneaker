import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";

interface Order {
    id: number;
    order_number: string;
    total_amount: string;
    order_status: string;
    payment_status: string;
    delivery_status: string;
    item_count: number;
    placed_at: string | null;
}

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    joined_at: string;
    order_count: number;
    total_spent: string;
}

interface Props {
    customer: Customer;
    orders: Order[];
    admin: { name: string };
}

function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const D_BG:  Record<string,string> = { Pending:"#fffbeb", Processing:"#eff6ff", Shipped:"#f5f3ff", Delivered:"#ecfdf5" };
const D_TXT: Record<string,string> = { Pending:"#b45309", Processing:"#1d4ed8", Shipped:"#6d28d9", Delivered:"#065f46" };
const D_BDR: Record<string,string> = { Pending:"#fde68a", Processing:"#bfdbfe", Shipped:"#ddd6fe", Delivered:"#a7f3d0" };
const P_BG:  Record<string,string> = { Confirmed:"#ecfdf5", Pending:"#fffbeb", COD:"#f8fafc", Failed:"#fef2f2" };
const P_TXT: Record<string,string> = { Confirmed:"#065f46", Pending:"#b45309", COD:"#475569", Failed:"#dc2626" };
const P_BDR: Record<string,string> = { Confirmed:"#a7f3d0", Pending:"#fde68a", COD:"#e2e8f0", Failed:"#fecaca" };

function DPill({ label }: { label: string }) {
    return <span style={{ display:"inline-block", padding:"2px 8px", fontSize:"9px", fontWeight:900, textTransform:"uppercase" as const, letterSpacing:"0.1em", backgroundColor:D_BG[label]??"#f9fafb", color:D_TXT[label]??"#374151", border:`1px solid ${D_BDR[label]??"#e5e7eb"}` }}>{label}</span>;
}
function PPill({ label }: { label: string }) {
    return <span style={{ display:"inline-block", padding:"2px 8px", fontSize:"9px", fontWeight:900, textTransform:"uppercase" as const, letterSpacing:"0.1em", backgroundColor:P_BG[label]??"#f9fafb", color:P_TXT[label]??"#374151", border:`1px solid ${P_BDR[label]??"#e5e7eb"}` }}>{label}</span>;
}

export default function AdminCustomersShow({ customer, orders, admin }: Props) {
    const handleToggle = () => {
        if (!confirm(`${customer.is_active ? "Deactivate" : "Activate"} ${customer.name}?`)) return;
        router.patch(route("admin.customers.toggleActive", customer.id), {}, { preserveScroll: true });
    };

    return (
        <AdminLayout
            adminName={admin.name}
            active="customers"
            pageTitle={customer.name}
            pageLabel="Customer Profile"
            headerRight={
                <button
                    onClick={handleToggle}
                    style={{ padding: "8px 20px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", border: "1px solid", borderColor: customer.is_active ? "#fecaca" : "#a7f3d0", backgroundColor: customer.is_active ? "#fef2f2" : "#ecfdf5", color: customer.is_active ? "#dc2626" : "#16a34a", cursor: "pointer" }}
                >
                    {customer.is_active ? "Deactivate Account" : "Activate Account"}
                </button>
            }
        >
            <Head title={`${customer.name} — Admin`} />

            {/* Back */}
            <Link
                href={route("admin.customers.index")}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.4)", textDecoration: "none", marginBottom: "28px" }}
            >
                ← All Customers
            </Link>

            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", alignItems: "start" }}>

                {/* ── LEFT: Profile card ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                    {/* Identity */}
                    <div style={{ border: "1px solid #f0f0f0", padding: "24px", backgroundColor: "#fff" }}>
                        {/* Avatar initial */}
                        <div style={{ width: "56px", height: "56px", backgroundColor: "#5B8C5A", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                            <span style={{ fontSize: "22px", fontWeight: 900, color: "#fff", textTransform: "uppercase" }}>
                                {customer.name.charAt(0)}
                            </span>
                        </div>

                        <h2 style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "4px" }}>{customer.name}</h2>

                        <span style={{ display: "inline-block", padding: "2px 8px", fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", backgroundColor: customer.is_active ? "#ecfdf5" : "#fef2f2", color: customer.is_active ? "#065f46" : "#dc2626", border: `1px solid ${customer.is_active ? "#a7f3d0" : "#fecaca"}`, marginBottom: "20px" }}>
                            {customer.is_active ? "Active" : "Inactive"}
                        </span>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {[
                                { label: "Email",  value: customer.email },
                                { label: "Phone",  value: customer.phone ?? "—" },
                                { label: "Joined", value: fmt(customer.joined_at) },
                            ].map(row => (
                                <div key={row.label}>
                                    <p style={{ fontSize: "7px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.3)", marginBottom: "2px" }}>{row.label}</p>
                                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#5B8C5A", wordBreak: "break-all" as const }}>{row.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ border: "1px solid #f0f0f0", padding: "20px 24px", backgroundColor: "#fff", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {[
                            { label: "Orders",       value: customer.order_count },
                            { label: "Total Spent",  value: `$${customer.total_spent}` },
                        ].map(s => (
                            <div key={s.label}>
                                <p style={{ fontSize: "22px", fontWeight: 900, lineHeight: 1, color: "#5B8C5A" }}>{s.value}</p>
                                <p style={{ fontSize: "7px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.3)", marginTop: "4px" }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT: Order history ── */}
                <div style={{ border: "1px solid #f0f0f0", backgroundColor: "#fff" }}>
                    <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f0f0" }}>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.4)" }}>Order History</p>
                    </div>

                    {orders.length === 0 ? (
                        <div style={{ padding: "48px 24px", textAlign: "center", color: "rgba(45,50,62,0.2)" }}>
                            <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em" }}>No orders yet</p>
                        </div>
                    ) : (
                        <div>
                            {/* Table header */}
                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 60px 90px 110px 110px 60px", gap: "0", padding: "10px 24px", backgroundColor: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                                {["Order", "Items", "Total", "Status", "Payment", ""].map(h => (
                                    <p key={h} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.3)" }}>{h}</p>
                                ))}
                            </div>
                            {/* Rows */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "#f0f0f0" }}>
                                {orders.map(o => (
                                    <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 60px 90px 110px 110px 60px", gap: "0", alignItems: "center", backgroundColor: "#fff", padding: "14px 24px" }}>
                                        <div>
                                            <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{o.order_number}</p>
                                            {o.placed_at && <p style={{ fontSize: "9px", color: "rgba(45,50,62,0.35)", fontWeight: 500, marginTop: "2px" }}>{fmt(o.placed_at)}</p>}
                                        </div>
                                        <p style={{ fontSize: "12px", fontWeight: 900 }}>{o.item_count}</p>
                                        <p style={{ fontSize: "12px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>${o.total_amount}</p>
                                        <DPill label={o.delivery_status} />
                                        <PPill label={o.payment_status} />
                                        <Link
                                            href={route("admin.orders.show", o.id)}
                                            style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#5B8C5A", textDecoration: "none", borderBottom: "1px solid #0A0A0A", paddingBottom: "1px", width: "fit-content" }}
                                        >
                                            View
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
