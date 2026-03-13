import React from "react";
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";

interface Order {
    id: number;
    order_number: string;
    customer_name: string;
    total_amount: string;
    delivery_status: string;
    payment_status: string;
    placed_at: string;
}

interface Props {
    orderStats: { total: number; pending: number; processing: number; shipped: number; delivered: number };
    revenueStats: { total: number; cod: number; card: number };
    totalCustomers: number;
    totalProducts: number;
    recentOrders: Order[];
    admin: { name: string };
}

function fmt(val: number) {
    return "$" + val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const DELIVERY_BG: Record<string, string> = {
    Pending: "#fffbeb", Processing: "#eff6ff", Shipped: "#f5f3ff", Delivered: "#ecfdf5",
};
const DELIVERY_TEXT: Record<string, string> = {
    Pending: "#b45309", Processing: "#1d4ed8", Shipped: "#6d28d9", Delivered: "#065f46",
};
const DELIVERY_BORDER: Record<string, string> = {
    Pending: "#fde68a", Processing: "#bfdbfe", Shipped: "#ddd6fe", Delivered: "#a7f3d0",
};
const PAYMENT_BG: Record<string, string> = {
    Confirmed: "#ecfdf5", Pending: "#fffbeb", COD: "#f8fafc", Failed: "#fef2f2",
};
const PAYMENT_TEXT: Record<string, string> = {
    Confirmed: "#065f46", Pending: "#b45309", COD: "#475569", Failed: "#dc2626",
};
const PAYMENT_BORDER: Record<string, string> = {
    Confirmed: "#a7f3d0", Pending: "#fde68a", COD: "#e2e8f0", Failed: "#fecaca",
};

function DeliveryPill({ label }: { label: string }) {
    return (
        <span style={{
            display: "inline-block", padding: "2px 8px", fontSize: "9px", fontWeight: 900,
            textTransform: "uppercase" as const, letterSpacing: "0.1em",
            backgroundColor: DELIVERY_BG[label] ?? "#f9fafb",
            color: DELIVERY_TEXT[label] ?? "#374151",
            border: `1px solid ${DELIVERY_BORDER[label] ?? "#e5e7eb"}`,
        }}>
            {label}
        </span>
    );
}

function PaymentPill({ label }: { label: string }) {
    return (
        <span style={{
            display: "inline-block", padding: "2px 8px", fontSize: "9px", fontWeight: 900,
            textTransform: "uppercase" as const, letterSpacing: "0.1em",
            backgroundColor: PAYMENT_BG[label] ?? "#f9fafb",
            color: PAYMENT_TEXT[label] ?? "#374151",
            border: `1px solid ${PAYMENT_BORDER[label] ?? "#e5e7eb"}`,
        }}>
            {label}
        </span>
    );
}

const DELIVERY_LEFT_BORDER: Record<string, string> = {
    Pending: "#f59e0b", Processing: "#3b82f6", Shipped: "#8b5cf6", Delivered: "#10b981",
};

export default function AdminDashboard({ orderStats, revenueStats, totalCustomers, totalProducts, recentOrders, admin }: Props) {
    return (
        <AdminLayout adminName={admin.name} active="dashboard" pageTitle="Dashboard" pageLabel="Overview">
            <Head title="Admin - Sneaker.DRP" />

            {/* ── TOP STAT CARDS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>

                {/* Revenue — dark card */}
                <div style={{ backgroundColor: "#0A0A0A", color: "#fff", padding: "28px", gridColumn: "span 1" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>
                        Total Revenue
                    </p>
                    <p style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}>
                        {fmt(revenueStats.total)}
                    </p>
                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div>
                            <p style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)" }}>Card</p>
                            <p style={{ fontSize: "14px", fontWeight: 900, marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>{fmt(revenueStats.card)}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)" }}>COD</p>
                            <p style={{ fontSize: "14px", fontWeight: 900, marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>{fmt(revenueStats.cod)}</p>
                        </div>
                    </div>
                </div>

                {/* Orders */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "28px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.4)", marginBottom: "12px" }}>
                        Total Orders
                    </p>
                    <p style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}>
                        {orderStats.total}
                    </p>
                    <Link href={route("admin.orders.index")} style={{ display: "inline-block", marginTop: "16px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)", textDecoration: "none", borderBottom: "1px solid currentColor", paddingBottom: "1px" }}>
                        View All →
                    </Link>
                </div>

                {/* Customers */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "28px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.4)", marginBottom: "12px" }}>
                        Customers
                    </p>
                    <p style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}>
                        {totalCustomers}
                    </p>
                    <p style={{ marginTop: "16px", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.25)" }}>
                        Registered accounts
                    </p>
                </div>

                {/* Products */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "28px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.4)", marginBottom: "12px" }}>
                        Active Products
                    </p>
                    <p style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}>
                        {totalProducts}
                    </p>
                    <p style={{ marginTop: "16px", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.25)" }}>
                        In the archive
                    </p>
                </div>
            </div>

            {/* ── DELIVERY BREAKDOWN ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {[
                    { label: "Pending",    value: orderStats.pending },
                    { label: "Processing", value: orderStats.processing },
                    { label: "Shipped",    value: orderStats.shipped },
                    { label: "Delivered",  value: orderStats.delivered },
                ].map((item) => (
                    <Link
                        key={item.label}
                        href={route("admin.orders.index", { status: item.label })}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            backgroundColor: "#fff", border: "1px solid #f0f0f0",
                            borderLeft: `4px solid ${DELIVERY_LEFT_BORDER[item.label]}`,
                            padding: "20px 24px", textDecoration: "none", color: "inherit",
                        }}
                    >
                        <div>
                            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)" }}>
                                {item.label}
                            </p>
                            <p style={{ fontSize: "24px", fontWeight: 900, marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>
                                {item.value}
                            </p>
                        </div>
                        <span style={{ fontSize: "14px", color: "rgba(45,50,62,0.2)" }}>→</span>
                    </Link>
                ))}
            </div>

            {/* ── RECENT ORDERS ── */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0" }}>
                {/* Header */}
                <div style={{ padding: "20px 32px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "2px" }}>
                            Latest Activity
                        </p>
                        <h3 style={{ fontSize: "15px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                            Recent Orders
                        </h3>
                    </div>
                    <Link href={route("admin.orders.index")} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)", textDecoration: "none", borderBottom: "1px solid currentColor", paddingBottom: "1px" }}>
                        View All →
                    </Link>
                </div>

                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr", gap: "16px", padding: "12px 32px", borderBottom: "1px solid #fafafa" }}>
                    {["Order", "Customer", "Date", "Delivery", "Payment", "Total"].map((h) => (
                        <p key={h} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.25)" }}>
                            {h}
                        </p>
                    ))}
                </div>

                {recentOrders.length === 0 ? (
                    <div style={{ padding: "64px 32px", textAlign: "center", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.2)" }}>
                        No orders yet
                    </div>
                ) : (
                    recentOrders.map((order) => (
                        <Link
                            key={order.id}
                            href={route("admin.orders.show", order.id)}
                            style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr", gap: "16px", alignItems: "center", padding: "16px 32px", borderBottom: "1px solid #fafafa", textDecoration: "none", color: "inherit", backgroundColor: "transparent" }}
                        >
                            <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{order.order_number}</p>
                            <p style={{ fontSize: "12px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.customer_name}</p>
                            <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(45,50,62,0.5)" }}>{order.placed_at ? fmtDate(order.placed_at) : "—"}</p>
                            <div><DeliveryPill label={order.delivery_status} /></div>
                            <div><PaymentPill label={order.payment_status} /></div>
                            <p style={{ fontSize: "12px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>${parseFloat(order.total_amount).toFixed(2)}</p>
                        </Link>
                    ))
                )}
            </div>
        </AdminLayout>
    );
}
