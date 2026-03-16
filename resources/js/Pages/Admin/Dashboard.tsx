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

interface LowStockVariant {
    id: number;
    product_id: number;
    product_name: string;
    color_name: string;
    color_hex: string;
    size_value: string;
    stock_quantity: number;
}

interface Props {
    orderStats: { total: number; pending: number; processing: number; shipped: number; delivered: number };
    revenueStats: { total: number; cod: number; card: number };
    totalCustomers: number;
    totalProducts: number;
    recentOrders: Order[];
    lowStock: LowStockVariant[];
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

export default function AdminDashboard({ orderStats, revenueStats, totalCustomers, totalProducts, lowStock, recentOrders, admin }: Props) {
    return (
        <AdminLayout adminName={admin.name} active="dashboard" pageTitle="Dashboard" pageLabel="Overview">
            <Head title="Admin - WALKER SNEAKER" />

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


            {/* ── LOW STOCK ALERT ── */}
            {lowStock.length > 0 && (
                <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", marginBottom: "24px" }}>
                    {/* Header */}
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <div>
                                <p style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.3em", color: "#92400e", marginBottom: "2px" }}>
                                    Inventory Alert
                                </p>
                                <h3 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "-0.01em", color: "#78350f" }}>
                                    Low Stock — {lowStock.length} {lowStock.length === 1 ? "Variant" : "Variants"}
                                </h3>
                            </div>
                        </div>
                        <Link
                            href={route("admin.products.index")}
                            style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.15em", color: "#92400e", textDecoration: "none", borderBottom: "1px solid #92400e", paddingBottom: "1px" }}
                        >
                            Manage Products →
                        </Link>
                    </div>

                    {/* Column headers */}
                    <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 80px 100px", gap: "16px", padding: "10px 24px", borderBottom: "1px solid #fde68a", backgroundColor: "#fef3c7" }}>
                        {["Product", "Color", "Size", "Stock", ""].map(h => (
                            <p key={h} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.2em", color: "#92400e" }}>{h}</p>
                        ))}
                    </div>

                    {/* Rows */}
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: "1px", backgroundColor: "#fde68a" }}>
                        {lowStock.map(v => (
                            <div
                                key={v.id}
                                style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 80px 100px", gap: "16px", alignItems: "center", padding: "14px 24px", backgroundColor: "#fffbeb" }}
                            >
                                {/* Product name */}
                                <p style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "-0.01em", color: "#0A0A0A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                    {v.product_name}
                                </p>

                                {/* Color swatch + name */}
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: v.color_hex, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "rgba(45,50,62,0.7)" }}>
                                        {v.color_name}
                                    </span>
                                </div>

                                {/* Size */}
                                <p style={{ fontSize: "11px", fontWeight: 900, color: "rgba(45,50,62,0.7)" }}>
                                    US {v.size_value}
                                </p>

                                {/* Stock badge */}
                                <span style={{
                                    display: "inline-block", padding: "3px 8px",
                                    fontSize: "10px", fontWeight: 900, fontVariantNumeric: "tabular-nums",
                                    backgroundColor: v.stock_quantity === 0 ? "#fef2f2" : "#fffbeb",
                                    color: v.stock_quantity === 0 ? "#dc2626" : "#d97706",
                                    border: `1px solid ${v.stock_quantity === 0 ? "#fecaca" : "#fde68a"}`,
                                }}>
                                    {v.stock_quantity === 0 ? "Out" : `${v.stock_quantity} left`}
                                </span>

                                {/* Edit link */}
                                <Link
                                    href={route("admin.products.edit", v.product_id)}
                                    style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#92400e", textDecoration: "none", borderBottom: "1px solid #92400e", paddingBottom: "1px", width: "fit-content" }}
                                >
                                    Edit Stock →
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
