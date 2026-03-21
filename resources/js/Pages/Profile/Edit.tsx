import React, { useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Address {
    id: number;
    full_name: string;
    phone: string;
    address_line: string;
    city: string;
    state_region: string | null;
    postal_code: string | null;
    country: string;
    is_default: boolean;
}

interface RecentOrder {
    id: number;
    order_number: string;
    total_amount: string;
    delivery_status: string;
    payment_status: string;
    placed_at: string;
    item_count: number;
    preview_name: string;
}

interface OrderStats {
    total: number;
    pending: number;
    shipped: number;
    delivered: number;
    spent: number;
}

interface ProfileUser {
    name: string;
    email: string;
    phone: string | null;
}

interface Props {
    orderStats: OrderStats;
    recentOrders: RecentOrder[];
    addresses: Address[];
    profileUser: ProfileUser;
    status?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (v: string | number) => `$${parseFloat(String(v)).toFixed(2)}`;

function formatDate(iso: string) {
    // Parse with timeZone:"UTC" so the displayed date matches the stored date.
    // Without this, e.g. 2026-03-14 21:51:30 UTC shows as Mar 15 in UTC+7.
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    Pending:    { bg: "#fefce8", color: "#ca8a04" },
    Processing: { bg: "#eff6ff", color: "#2563eb" },
    Shipped:    { bg: "#f0f9ff", color: "#0369a1" },
    Delivered:  { bg: "#f0fdf4", color: "#16a34a" },
    Confirmed:  { bg: "#f0fdf4", color: "#16a34a" },
    COD:        { bg: "#fef3c7", color: "#d97706" },
};

function Pill({ label }: { label: string }) {
    const s = STATUS_COLORS[label] ?? { bg: "#f5f5f7", color: "#6b7280" };
    return (
        <span style={{ backgroundColor: s.bg, color: s.color, fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", padding: "3px 8px" }}>
            {label}
        </span>
    );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: "48px" }}>
            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.4em", color: "rgba(45,50,62,0.3)", marginBottom: "20px" }}>
                {title}
            </p>
            {children}
        </div>
    );
}

// ── Address Form ──────────────────────────────────────────────────────────────

const EMPTY_ADDR = {
    full_name: "", phone: "", address_line: "", city: "",
    state_region: "", postal_code: "", country: "", is_default: false as boolean,
};

function AddressForm({
    initial = EMPTY_ADDR,
    onSubmit,
    onCancel,
    submitLabel = "Save Address",
}: {
    initial?: typeof EMPTY_ADDR;
    onSubmit: (data: typeof EMPTY_ADDR) => void;
    onCancel: () => void;
    submitLabel?: string;
}) {
    const [d, setD] = useState({ ...initial });
    const set = (k: keyof typeof EMPTY_ADDR, v: string | boolean) =>
        setD((p) => ({ ...p, [k]: v }));

    const inputStyle: React.CSSProperties = {
        width: "100%", border: "1px solid #e5e7eb", padding: "10px 12px",
        fontSize: "11px", fontWeight: 600, outline: "none", boxSizing: "border-box",
        backgroundColor: "#fff",
    };
    const labelStyle: React.CSSProperties = {
        display: "block", fontSize: "8px", fontWeight: 900,
        textTransform: "uppercase", letterSpacing: "0.2em",
        color: "rgba(45,50,62,0.4)", marginBottom: "6px",
    };

    return (
        <div style={{ backgroundColor: "#fafafa", border: "1px solid #f0f0f0", padding: "24px", marginTop: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                    <label style={labelStyle}>Full Name</label>
                    <input style={inputStyle} value={d.full_name} onChange={e => set("full_name", e.target.value)} />
                </div>
                <div>
                    <label style={labelStyle}>Phone</label>
                    <input style={inputStyle} value={d.phone} onChange={e => set("phone", e.target.value)} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Address Line</label>
                    <input style={inputStyle} value={d.address_line} onChange={e => set("address_line", e.target.value)} />
                </div>
                <div>
                    <label style={labelStyle}>City</label>
                    <input style={inputStyle} value={d.city} onChange={e => set("city", e.target.value)} />
                </div>
                <div>
                    <label style={labelStyle}>State / Region</label>
                    <input style={inputStyle} value={d.state_region ?? ""} onChange={e => set("state_region", e.target.value)} />
                </div>
                <div>
                    <label style={labelStyle}>Postal Code</label>
                    <input style={inputStyle} value={d.postal_code ?? ""} onChange={e => set("postal_code", e.target.value)} />
                </div>
                <div>
                    <label style={labelStyle}>Country</label>
                    <input style={inputStyle} value={d.country} onChange={e => set("country", e.target.value)} />
                </div>
            </div>
            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                    id="is_default_check"
                    type="checkbox"
                    checked={!!d.is_default}
                    onChange={e => set("is_default", e.target.checked)}
                    style={{ width: "14px", height: "14px", cursor: "pointer" }}
                />
                <label htmlFor="is_default_check" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>
                    Set as default address
                </label>
            </div>
            <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
                <button
                    onClick={() => onSubmit(d)}
                    style={{ padding: "10px 24px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", border: "none", cursor: "pointer" }}
                >
                    {submitLabel}
                </button>
                <button
                    onClick={onCancel}
                    style={{ padding: "10px 20px", backgroundColor: "transparent", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", border: "1px solid #e5e7eb", cursor: "pointer", color: "rgba(45,50,62,0.5)" }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfileEdit({ orderStats, recentOrders, addresses, profileUser, status }: Props) {
    const { auth, cart }: any = usePage().props;
    const cartCount = cart?.items?.reduce((a: number, i: any) => a + i.quantity, 0) || 0;

    // Active tab
    const [tab, setTab] = useState<"overview" | "orders" | "addresses" | "settings">("overview");

    // Address UI state
    const [showAddForm, setShowAddForm]     = useState(false);
    const [editingId,   setEditingId]       = useState<number | null>(null);
    const [deletingId,  setDeletingId]      = useState<number | null>(null);

    // Settings form
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        name:  profileUser.name,
        email: profileUser.email,
        phone: profileUser.phone ?? "",
    });

    // Password form
    const pwForm = useForm({ current_password: "", password: "", password_confirmation: "" });

    // ── Address actions ───────────────────────────────────────────────────────
    const handleAddAddress = (d: typeof EMPTY_ADDR) => {
        router.post(route("profile.address.store"), d, {
            onSuccess: () => setShowAddForm(false),
            preserveScroll: true,
        });
    };

    const handleUpdateAddress = (id: number, d: typeof EMPTY_ADDR) => {
        router.patch(route("profile.address.update", id), d, {
            onSuccess: () => setEditingId(null),
            preserveScroll: true,
        });
    };

    const handleDeleteAddress = (id: number) => {
        router.delete(route("profile.address.destroy", id), {
            onSuccess: () => setDeletingId(null),
            preserveScroll: true,
        });
    };

    const handleSetDefault = (id: number) => {
        router.patch(route("profile.address.setDefault", id), {}, { preserveScroll: true });
    };

    // ── Shared styles ─────────────────────────────────────────────────────────
    const tabBtn = (t: typeof tab): React.CSSProperties => ({
        padding: "10px 20px",
        fontSize: "9px",
        fontWeight: 900,
        textTransform: "uppercase",
        letterSpacing: "0.15em",
        border: "none",
        borderBottom: tab === t ? "2px solid #0A0A0A" : "2px solid transparent",
        backgroundColor: "transparent",
        color: tab === t ? "#0A0A0A" : "rgba(45,50,62,0.35)",
        cursor: "pointer",
        transition: "color 0.15s",
    });

    const inputStyle: React.CSSProperties = {
        width: "100%", border: "1px solid #e5e7eb", padding: "12px 14px",
        fontSize: "12px", fontWeight: 600, outline: "none",
        boxSizing: "border-box", backgroundColor: "#fff",
    };
    const labelStyle: React.CSSProperties = {
        display: "block", fontSize: "8px", fontWeight: 900,
        textTransform: "uppercase", letterSpacing: "0.2em",
        color: "rgba(45,50,62,0.4)", marginBottom: "8px",
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#fff", color: "#0A0A0A" }}>
            <Head title="My Account — SNEAKER.DRP" />

            {/* ── NAV ── */}
            <nav style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Link href={route("home")} style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", color: "#0A0A0A", textDecoration: "none" }}>
                        SNEAKER.DRP
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: "28px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                        <Link href={route("shop.index")} style={{ color: "rgba(45,50,62,0.4)", textDecoration: "none" }}>Shop</Link>
                        <Link href={route("orders.index")} style={{ color: "rgba(45,50,62,0.4)", textDecoration: "none" }}>Orders</Link>
                        <span style={{ color: "#0A0A0A", borderBottom: "2px solid #0A0A0A", paddingBottom: "2px" }}>Account</span>
                        <Link
                            href="/logout" method="post" as="button"
                            style={{ color: "rgba(45,50,62,0.35)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}
                        >
                            Log Out
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO HEADER ── */}
            <div style={{ backgroundColor: "#0A0A0A", color: "#fff", padding: "48px 32px" }}>
                <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }}>
                    <div>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.4em", color: "rgba(255,255,255,0.3)", marginBottom: "8px" }}>
                            Member Account
                        </p>
                        <h1 style={{ fontSize: "42px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: 1 }}>
                            {profileUser.name}
                        </h1>
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "8px", fontWeight: 600 }}>
                            {profileUser.email}
                        </p>
                    </div>
                    {/* Quick Stats */}
                    <div style={{ display: "flex", gap: "32px" }}>
                        {[
                            { label: "Total Orders", value: orderStats.total },
                            { label: "Delivered",    value: orderStats.delivered },
                            { label: "Total Spent",  value: fmt(orderStats.spent) },
                        ].map(s => (
                            <div key={s.label} style={{ textAlign: "right" }}>
                                <p style={{ fontSize: "28px", fontWeight: 900, lineHeight: 1 }}>{s.value}</p>
                                <p style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff", position: "sticky", top: "60px", zIndex: 40 }}>
                <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px", display: "flex", gap: "4px" }}>
                    {(["overview", "orders", "addresses", "settings"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} style={tabBtn(t)}>
                            {t === "overview" ? "Overview" : t === "orders" ? "Order History" : t === "addresses" ? "Address Book" : "Settings"}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 32px 80px" }}>

                {/* ── OVERVIEW TAB ── */}
                {tab === "overview" && (
                    <div>
                        {/* Stat Cards */}
                        <Section title="Order Pipeline">
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", backgroundColor: "#f0f0f0", border: "1px solid #f0f0f0", marginBottom: "48px" }}>
                                {[
                                    { label: "In Progress", value: orderStats.pending,   color: "#d97706" },
                                    { label: "Shipped",     value: orderStats.shipped,   color: "#2563eb" },
                                    { label: "Delivered",   value: orderStats.delivered, color: "#16a34a" },
                                    { label: "Total Spent", value: fmt(orderStats.spent), color: "#0A0A0A" },
                                ].map(s => (
                                    <div key={s.label} style={{ backgroundColor: "#fff", padding: "28px 24px" }}>
                                        <p style={{ fontSize: "32px", fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: "8px" }}>{s.value}</p>
                                        <p style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(45,50,62,0.35)" }}>{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Recent Orders preview */}
                        <Section title="Recent Drops">
                            {recentOrders.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#fafafa", border: "1px solid #f0f0f0" }}>
                                    <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.2)" }}>No orders yet</p>
                                    <Link href={route("shop.index")} style={{ display: "inline-block", marginTop: "16px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#0A0A0A", borderBottom: "1px solid #0A0A0A", textDecoration: "none", paddingBottom: "1px" }}>
                                        Browse the Collection →
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "#f0f0f0", border: "1px solid #f0f0f0" }}>
                                    {recentOrders.map(order => (
                                        <Link
                                            key={order.id}
                                            href={route("orders.show", order.id)}
                                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", padding: "16px 20px", textDecoration: "none", color: "inherit" }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                                <div>
                                                    <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>{order.order_number}</p>
                                                    <p style={{ fontSize: "10px", color: "rgba(45,50,62,0.4)", fontWeight: 600 }}>{order.preview_name} · {order.item_count} item{order.item_count !== 1 ? "s" : ""}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                <Pill label={order.delivery_status} />
                                                <p style={{ fontSize: "12px", fontWeight: 900, minWidth: "80px", textAlign: "right" }}>{fmt(order.total_amount)}</p>
                                                <p style={{ fontSize: "9px", color: "rgba(45,50,62,0.3)", fontWeight: 600 }}>{formatDate(order.placed_at)}</p>
                                                <span style={{ fontSize: "9px", fontWeight: 900, color: "rgba(45,50,62,0.25)" }}>→</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {recentOrders.length > 0 && (
                                <div style={{ marginTop: "16px" }}>
                                    <button onClick={() => setTab("orders")} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", background: "none", border: "none", borderBottom: "1px solid #0A0A0A", cursor: "pointer", paddingBottom: "1px" }}>
                                        View All Orders →
                                    </button>
                                </div>
                            )}
                        </Section>

                        {/* Default Address */}
                        <Section title="Default Ship-To">
                            {addresses.find(a => a.is_default) ? (() => {
                                const a = addresses.find(a => a.is_default)!;
                                return (
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px", border: "1px solid #0A0A0A", maxWidth: "400px" }}>
                                        <div style={{ fontSize: "11px", fontWeight: 600, lineHeight: 1.8, color: "rgba(45,50,62,0.7)" }}>
                                            <p style={{ fontWeight: 900, color: "#0A0A0A" }}>{a.full_name}</p>
                                            <p>{a.phone}</p>
                                            <p>{a.address_line}</p>
                                            <p>{a.city}{a.state_region ? `, ${a.state_region}` : ""}{a.postal_code ? ` ${a.postal_code}` : ""}</p>
                                            <p>{a.country}</p>
                                        </div>
                                        <button onClick={() => setTab("addresses")} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", background: "none", border: "none", borderBottom: "1px solid #0A0A0A", cursor: "pointer", paddingBottom: "1px", whiteSpace: "nowrap", marginLeft: "24px" }}>
                                            Manage →
                                        </button>
                                    </div>
                                );
                            })() : (
                                <button onClick={() => { setTab("addresses"); setShowAddForm(true); }} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", background: "none", border: "1px dashed #d1d5db", padding: "16px 24px", cursor: "pointer", color: "rgba(45,50,62,0.4)" }}>
                                    + Add Your Address
                                </button>
                            )}
                        </Section>
                    </div>
                )}

                {/* ── ORDERS TAB ── */}
                {tab === "orders" && (
                    <Section title="All Orders">
                        {recentOrders.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px", backgroundColor: "#fafafa", border: "1px solid #f0f0f0" }}>
                                <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.2)", marginBottom: "16px" }}>No orders yet</p>
                                <Link href={route("shop.index")} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#0A0A0A", borderBottom: "1px solid #0A0A0A", textDecoration: "none", paddingBottom: "1px" }}>
                                    Start Shopping →
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "#f0f0f0", border: "1px solid #f0f0f0" }}>
                                    {recentOrders.map(order => (
                                        <Link
                                            key={order.id}
                                            href={route("orders.show", order.id)}
                                            style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", alignItems: "center", gap: "24px", backgroundColor: "#fff", padding: "18px 20px", textDecoration: "none", color: "inherit" }}
                                        >
                                            <div>
                                                <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>{order.order_number}</p>
                                                <p style={{ fontSize: "10px", color: "rgba(45,50,62,0.4)", fontWeight: 600 }}>{order.preview_name} · {order.item_count} item{order.item_count !== 1 ? "s" : ""}</p>
                                            </div>
                                            <Pill label={order.delivery_status} />
                                            <Pill label={order.payment_status} />
                                            <p style={{ fontSize: "12px", fontWeight: 900 }}>{fmt(order.total_amount)}</p>
                                            <p style={{ fontSize: "9px", color: "rgba(45,50,62,0.3)", fontWeight: 600, minWidth: "90px", textAlign: "right" }}>{formatDate(order.placed_at)}</p>
                                        </Link>
                                    ))}
                                </div>
                                <div style={{ marginTop: "16px" }}>
                                    <Link href={route("orders.index")} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#0A0A0A", borderBottom: "1px solid #0A0A0A", textDecoration: "none", paddingBottom: "1px" }}>
                                        View Full Order History →
                                    </Link>
                                </div>
                            </>
                        )}
                    </Section>
                )}

                {/* ── ADDRESSES TAB ── */}
                {tab === "addresses" && (
                    <Section title="Address Book">
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                            {addresses.map(addr => (
                                <div key={addr.id}>
                                    {editingId === addr.id ? (
                                        <AddressForm
                                            initial={{
                                                full_name:    addr.full_name,
                                                phone:        addr.phone,
                                                address_line: addr.address_line,
                                                city:         addr.city,
                                                state_region: addr.state_region ?? "",
                                                postal_code:  addr.postal_code ?? "",
                                                country:      addr.country,
                                                is_default:   addr.is_default,
                                            }}
                                            onSubmit={d => handleUpdateAddress(addr.id, d)}
                                            onCancel={() => setEditingId(null)}
                                            submitLabel="Update Address"
                                        />
                                    ) : (
                                        <div style={{ border: `1px solid ${addr.is_default ? "#0A0A0A" : "#e5e7eb"}`, padding: "20px", position: "relative" }}>
                                            {addr.is_default && (
                                                <span style={{ position: "absolute", top: "12px", right: "12px", fontSize: "7px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", backgroundColor: "#0A0A0A", color: "#fff", padding: "3px 8px" }}>
                                                    Default
                                                </span>
                                            )}
                                            <div style={{ fontSize: "11px", fontWeight: 600, lineHeight: 1.8, color: "rgba(45,50,62,0.7)", marginBottom: "16px" }}>
                                                <p style={{ fontWeight: 900, color: "#0A0A0A", fontSize: "12px" }}>{addr.full_name}</p>
                                                <p>{addr.phone}</p>
                                                <p>{addr.address_line}</p>
                                                <p>{addr.city}{addr.state_region ? `, ${addr.state_region}` : ""}{addr.postal_code ? ` ${addr.postal_code}` : ""}</p>
                                                <p>{addr.country}</p>
                                            </div>
                                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                                <button onClick={() => setEditingId(addr.id)} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", background: "none", border: "none", borderBottom: "1px solid #0A0A0A", cursor: "pointer", paddingBottom: "1px" }}>
                                                    Edit
                                                </button>
                                                {!addr.is_default && (
                                                    <button onClick={() => handleSetDefault(addr.id)} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", background: "none", border: "none", borderBottom: "1px solid #6b7280", cursor: "pointer", paddingBottom: "1px", color: "#6b7280" }}>
                                                        Set Default
                                                    </button>
                                                )}
                                                {deletingId === addr.id ? (
                                                    <span style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <span style={{ color: "rgba(45,50,62,0.4)" }}>Confirm?</span>
                                                        <button onClick={() => handleDeleteAddress(addr.id)} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 900, fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Yes</button>
                                                        <button onClick={() => setDeletingId(null)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 900, fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)" }}>No</button>
                                                    </span>
                                                ) : (
                                                    <button onClick={() => setDeletingId(addr.id)} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", background: "none", border: "none", borderBottom: "1px solid #dc2626", cursor: "pointer", paddingBottom: "1px", color: "#dc2626" }}>
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add new card */}
                            {!showAddForm && (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    style={{ border: "1px dashed #d1d5db", padding: "20px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "transparent", minHeight: "160px" }}
                                >
                                    <span style={{ fontSize: "24px", color: "rgba(45,50,62,0.2)", lineHeight: 1 }}>+</span>
                                    <span style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.3)" }}>Add Address</span>
                                </button>
                            )}
                        </div>

                        {showAddForm && (
                            <AddressForm
                                onSubmit={handleAddAddress}
                                onCancel={() => setShowAddForm(false)}
                            />
                        )}
                    </Section>
                )}

                {/* ── SETTINGS TAB ── */}
                {tab === "settings" && (
                    <div style={{ maxWidth: "560px" }}>
                        {/* Profile info */}
                        <Section title="Personal Info">
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {status === "profile-updated" && (
                                    <div style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>
                                        Profile updated successfully.
                                    </div>
                                )}
                                <div>
                                    <label style={labelStyle}>Full Name</label>
                                    <input style={inputStyle} value={data.name} onChange={e => setData("name", e.target.value)} />
                                    {errors.name && <p style={{ color: "#dc2626", fontSize: "10px", marginTop: "4px" }}>{errors.name}</p>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Email Address</label>
                                    <input style={inputStyle} type="email" value={data.email} onChange={e => setData("email", e.target.value)} />
                                    {errors.email && <p style={{ color: "#dc2626", fontSize: "10px", marginTop: "4px" }}>{errors.email}</p>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone (optional)</label>
                                    <input style={inputStyle} type="tel" value={data.phone} onChange={e => setData("phone", e.target.value)} />
                                </div>
                                <button
                                    onClick={() => patch(route("profile.update"))}
                                    disabled={processing}
                                    style={{ padding: "12px 28px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", border: "none", cursor: processing ? "not-allowed" : "pointer", alignSelf: "flex-start", opacity: processing ? 0.6 : 1 }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </Section>

                        {/* Password */}
                        <Section title="Change Password">
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {[
                                    { key: "current_password", label: "Current Password" },
                                    { key: "password",         label: "New Password" },
                                    { key: "password_confirmation", label: "Confirm New Password" },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label style={labelStyle}>{f.label}</label>
                                        <input
                                            style={inputStyle}
                                            type="password"
                                            value={(pwForm.data as any)[f.key]}
                                            onChange={e => pwForm.setData(f.key as any, e.target.value)}
                                        />
                                        {(pwForm.errors as any)[f.key] && (
                                            <p style={{ color: "#dc2626", fontSize: "10px", marginTop: "4px" }}>{(pwForm.errors as any)[f.key]}</p>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => pwForm.put(route("password.update"), { onSuccess: () => pwForm.reset() })}
                                    disabled={pwForm.processing}
                                    style={{ padding: "12px 28px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", border: "none", cursor: pwForm.processing ? "not-allowed" : "pointer", alignSelf: "flex-start", opacity: pwForm.processing ? 0.6 : 1 }}
                                >
                                    Update Password
                                </button>
                            </div>
                        </Section>

                        {/* Danger zone */}
                        <Section title="Danger Zone">
                            <div style={{ border: "1px solid #fecaca", padding: "20px 24px" }}>
                                <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(45,50,62,0.6)", marginBottom: "16px", lineHeight: 1.6 }}>
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                                <Link
                                    href={route("profile.edit") + "#delete"}
                                    style={{ display: "inline-block", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#dc2626", border: "1px solid #fecaca", padding: "10px 20px", textDecoration: "none" }}
                                >
                                    Delete Account
                                </Link>
                            </div>
                        </Section>
                    </div>
                )}
            </div>
        </div>
    );
}
