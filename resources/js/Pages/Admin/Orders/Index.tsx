import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import Pagination from "@/Components/Pagination";
import AdminLayout from "@/Components/AdminLayout";

interface Order {
    id: number;
    order_number: string;
    customer_name: string;
    customer_email: string | null;
    total_amount: string;
    item_count: number;
    order_status: string;
    payment_status: string;
    delivery_status: string;
    payment_method: string | null;
    placed_at: string;
}

interface Stats { total: number; pending: number; processing: number; shipped: number; delivered: number }
interface Props {
    orders: { data: Order[]; current_page: number; last_page: number; from: number|null; to: number|null; total: number; links: any[] };
    stats: Stats;
    filters: { status?: string; payment?: string; search?: string };
    admin: { name: string };
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const D_BG: Record<string,string> = { Pending:"#fffbeb", Processing:"#eff6ff", Shipped:"#f5f3ff", Delivered:"#ecfdf5" };
const D_TXT: Record<string,string> = { Pending:"#b45309", Processing:"#1d4ed8", Shipped:"#6d28d9", Delivered:"#065f46" };
const D_BDR: Record<string,string> = { Pending:"#fde68a", Processing:"#bfdbfe", Shipped:"#ddd6fe", Delivered:"#a7f3d0" };
const P_BG: Record<string,string> = { Confirmed:"#ecfdf5", Pending:"#fffbeb", COD:"#f8fafc", Failed:"#fef2f2" };
const P_TXT: Record<string,string> = { Confirmed:"#065f46", Pending:"#b45309", COD:"#475569", Failed:"#dc2626" };
const P_BDR: Record<string,string> = { Confirmed:"#a7f3d0", Pending:"#fde68a", COD:"#e2e8f0", Failed:"#fecaca" };

function DPill({ label }: { label: string }) {
    return <span style={{ display:"inline-block", padding:"2px 8px", fontSize:"9px", fontWeight:900, textTransform:"uppercase" as const, letterSpacing:"0.1em", backgroundColor:D_BG[label]??"#f9fafb", color:D_TXT[label]??"#374151", border:`1px solid ${D_BDR[label]??"#e5e7eb"}` }}>{label}</span>;
}
function PPill({ label }: { label: string }) {
    return <span style={{ display:"inline-block", padding:"2px 8px", fontSize:"9px", fontWeight:900, textTransform:"uppercase" as const, letterSpacing:"0.1em", backgroundColor:P_BG[label]??"#f9fafb", color:P_TXT[label]??"#374151", border:`1px solid ${P_BDR[label]??"#e5e7eb"}` }}>{label}</span>;
}

export default function AdminOrdersIndex({ orders, stats, filters, admin }: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const activeStatus  = filters.status  ?? "";
    const activePayment = filters.payment ?? "";

    const apply = (overrides: Record<string, string>) => {
        router.get(route("admin.orders.index"), { search, status: activeStatus, payment: activePayment, page: 1, ...overrides }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSearch("");
        router.get(route("admin.orders.index"), {}, { preserveState: false, replace: true });
    };

    const isFiltered = !!(activeStatus || activePayment || filters.search);

    const statusTabs = [
        { label: "All",        value: "",           count: stats.total },
        { label: "Pending",    value: "Pending",    count: stats.pending },
        { label: "Processing", value: "Processing", count: stats.processing },
        { label: "Shipped",    value: "Shipped",    count: stats.shipped },
        { label: "Delivered",  value: "Delivered",  count: stats.delivered },
    ];

    const paymentTabs = [
        { label: "All Payments", value: "" },
        { label: "Confirmed",    value: "Confirmed" },
        { label: "COD",          value: "COD" },
        { label: "Pending",      value: "Pending" },
    ];

    return (
        <AdminLayout adminName={admin.name} active="orders" pageTitle="Orders" pageLabel="Management">
            <Head title="Admin - Orders" />

            {/* ── STAT CARDS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
                {statusTabs.map((tab) => {
                    const isActive = activeStatus === tab.value;
                    return (
                        <button
                            key={tab.value}
                            onClick={() => apply({ status: tab.value })}
                            style={{
                                padding: "20px", textAlign: "left", border: `1px solid ${isActive ? "#5B8C5A" : "#f0f0f0"}`,
                                backgroundColor: isActive ? "#5B8C5A" : "#fff",
                                color: isActive ? "#fff" : "#5B8C5A",
                                cursor: "pointer", transition: "all 0.15s",
                            }}
                        >
                            <p style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}>{tab.count}</p>
                            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", opacity: isActive ? 0.6 : 0.4 }}>{tab.label}</p>
                        </button>
                    );
                })}
            </div>

            {/* ── SEARCH + FILTER ── */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
                <form onSubmit={(e) => { e.preventDefault(); apply({ search }); }} style={{ flex: 1, display: "flex", gap: "12px" }}>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search order number or customer name..."
                        style={{ flex: 1, border: "1px solid #e5e7eb", backgroundColor: "#fff", padding: "12px 16px", fontSize: "12px", outline: "none" }}
                    />
                    <button type="submit" style={{ padding: "12px 24px", backgroundColor: "#5B8C5A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", border: "none", cursor: "pointer" }}>
                        Search
                    </button>
                </form>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {paymentTabs.map((p) => {
                        const isActive = activePayment === p.value;
                        return (
                            <button key={p.value} onClick={() => apply({ payment: p.value })} style={{ padding: "12px 16px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: `1px solid ${isActive ? "#5B8C5A" : "#e5e7eb"}`, backgroundColor: isActive ? "#5B8C5A" : "#fff", color: isActive ? "#fff" : "rgba(45,50,62,0.5)", cursor: "pointer" }}>
                                {p.label}
                            </button>
                        );
                    })}

                    {isFiltered && (
                        <button
                            onClick={clearFilters}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "12px 16px", fontSize: "9px", fontWeight: 900,
                                textTransform: "uppercase", letterSpacing: "0.1em",
                                border: "1px solid #fecaca", backgroundColor: "#fef2f2",
                                color: "#dc2626", cursor: "pointer",
                                marginLeft: "4px",
                            }}
                        >
                            <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* ── TABLE ── */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0" }}>
                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "2.5fr 2fr 0.6fr 1fr 1.2fr 1fr 1fr 0.8fr", gap: "16px", padding: "14px 24px", borderBottom: "1px solid #f0f0f0" }}>
                    {["Order", "Customer", "Items", "Date", "Delivery", "Payment", "Total", "Action"].map((h, i) => (
                        <p key={h} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.25)", textAlign: i >= 6 ? "right" : "left" }}>{h}</p>
                    ))}
                </div>

                {orders.data.length === 0 && (
                    <div style={{ padding: "80px 24px", textAlign: "center", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.2)" }}>
                        No orders found
                    </div>
                )}

                {orders.data.map((order) => (
                    <div key={order.id} style={{ display: "grid", gridTemplateColumns: "2.5fr 2fr 0.6fr 1fr 1.2fr 1fr 1fr 0.8fr", gap: "16px", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #fafafa" }}>
                        <div>
                            <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{order.order_number}</p>
                            {order.payment_method && <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.35)", marginTop: "2px" }}>{order.payment_method}</p>}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                            <p style={{ fontSize: "12px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.customer_name}</p>
                            {order.customer_email && <p style={{ fontSize: "9px", color: "rgba(45,50,62,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>{order.customer_email}</p>}
                        </div>
                        <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(45,50,62,0.6)", fontVariantNumeric: "tabular-nums" }}>{order.item_count}</p>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(45,50,62,0.5)" }}>{order.placed_at ? fmtDate(order.placed_at) : "—"}</p>
                        <div><DPill label={order.delivery_status} /></div>
                        <div><PPill label={order.payment_status} /></div>
                        <p style={{ fontSize: "12px", fontWeight: 900, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>${parseFloat(order.total_amount).toFixed(2)}</p>
                        <div style={{ textAlign: "right" }}>
                            <Link href={route("admin.orders.show", order.id)} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)", textDecoration: "none", borderBottom: "1px solid currentColor", paddingBottom: "1px" }}>
                                Manage →
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination data={orders} preserveFilters={{ search, status: activeStatus, payment: activePayment }} />
        </AdminLayout>
    );
}
