import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";
import Pagination from "@/Components/Pagination";

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    order_count: number;
    total_spent: number;
    joined_at: string;
    last_order_at: string | null;
}

interface Stats {
    total: number;
    active: number;
    inactive: number;
    revenue: number;
}

interface Paginator {
    data: Customer[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    customers: Paginator;
    stats: Stats;
    admin: { name: string };
}

function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Bangkok" });
}

export default function AdminCustomersIndex({ customers, stats, admin }: Props) {
    const [search,    setSearch]    = useState("");
    const [statusTab, setStatusTab] = useState<"all" | "active" | "inactive">("all");
    const [sortBy,    setSortBy]    = useState<"joined" | "spent" | "orders">("joined");

    const filtered = customers.data
        .filter(c => {
            const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                                c.email.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusTab === "all" ? true
                : statusTab === "active" ? c.is_active : !c.is_active;
            return matchSearch && matchStatus;
        })
        .sort((a, b) => {
            if (sortBy === "spent")  return b.total_spent - a.total_spent;
            if (sortBy === "orders") return b.order_count - a.order_count;
            return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
        });

    const handleToggle = (id: number, name: string, active: boolean) => {
        if (!confirm(`${active ? "Deactivate" : "Activate"} ${name}?`)) return;
        router.patch(route("admin.customers.toggleActive", id), {}, { preserveScroll: true });
    };

    const tabStyle = (t: typeof statusTab): React.CSSProperties => ({
        padding: "8px 16px",
        fontSize: "9px",
        fontWeight: 900,
        textTransform: "uppercase" as const,
        letterSpacing: "0.15em",
        border: "none",
        borderBottom: statusTab === t ? "2px solid #0A0A0A" : "2px solid transparent",
        backgroundColor: "transparent",
        color: statusTab === t ? "#0A0A0A" : "rgba(45,50,62,0.3)",
        cursor: "pointer",
        whiteSpace: "nowrap" as const,
    });

    return (
        <AdminLayout
            adminName={admin.name}
            active="customers"
            pageTitle="Customers"
            pageLabel="Customer Management"
            headerRight={
                /* Only show 3 stats on mobile to avoid header overflow */
                <div style={{ display: "flex", gap: "16px", flexShrink: 0 }}>
                    {[
                        { label: "Total",    value: stats.total,    color: "#0A0A0A" },
                        { label: "Active",   value: stats.active,   color: "#16a34a" },
                        { label: "Inactive", value: stats.inactive, color: "#dc2626" },
                    ].map(s => (
                        <div key={s.label} style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "18px", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
                            <p style={{ fontSize: "7px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.3)", marginTop: "2px" }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            }
        >
            <Head title="Customers — Admin" />

            {/* ── CONTROLS ── */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px", marginBottom: "16px" }}>
                {/* Search — full width */}
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    style={{ border: "1px solid #e5e7eb", padding: "10px 14px", fontSize: "11px", fontWeight: 500, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const }}
                />
                {/* Sort buttons — scrollable on mobile */}
                <div style={{ overflowX: "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "min-content" }}>
                        <span style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.3)", flexShrink: 0 }}>Sort</span>
                        {([["joined", "Newest"], ["spent", "Top Spenders"], ["orders", "Most Orders"]] as const).map(([val, label]) => (
                            <button key={val} onClick={() => setSortBy(val)}
                                style={{ padding: "5px 12px", fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "1px solid", borderColor: sortBy === val ? "#0A0A0A" : "#e5e7eb", backgroundColor: sortBy === val ? "#0A0A0A" : "#fff", color: sortBy === val ? "#fff" : "rgba(45,50,62,0.4)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── STATUS TABS — scrollable on mobile ── */}
            <div style={{ overflowX: "auto", borderBottom: "1px solid #f0f0f0", marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "4px", minWidth: "min-content" }}>
                    <button onClick={() => setStatusTab("all")}      style={tabStyle("all")}>All ({stats.total})</button>
                    <button onClick={() => setStatusTab("active")}   style={tabStyle("active")}>Active ({stats.active})</button>
                    <button onClick={() => setStatusTab("inactive")} style={tabStyle("inactive")}>Inactive ({stats.inactive})</button>
                </div>
            </div>

            {/* ── TABLE ── */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(45,50,62,0.2)" }}>
                    <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em" }}>No customers found</p>
                </div>
            ) : (
                <div style={{ border: "1px solid #f0f0f0", overflow: "hidden" }}>
                    {/* Desktop header */}
                    <div className="cust-header" style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #f0f0f0", padding: "10px 20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 80px 100px 120px 100px 100px", gap: "0" }}>
                            {["Customer", "Email", "Orders", "Spent", "Joined", "Status", ""].map(h => (
                                <p key={h} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.35)" }}>{h}</p>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "#f0f0f0" }}>
                        {filtered.map(c => (
                            <div key={c.id} style={{ backgroundColor: "#fff" }}>

                                {/* ── MOBILE CARD ── */}
                                <div className="cust-mobile" style={{ padding: "14px 16px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                                        <div style={{ minWidth: 0, marginRight: "12px" }}>
                                            <Link href={route("admin.customers.show", c.id)}
                                                style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#0A0A0A", textDecoration: "none" }}>
                                                {c.name}
                                            </Link>
                                            {c.phone && <p style={{ fontSize: "9px", color: "rgba(45,50,62,0.35)", marginTop: "2px" }}>{c.phone}</p>}
                                        </div>
                                        <span style={{ flexShrink: 0, display: "inline-block", padding: "3px 8px", fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", backgroundColor: c.is_active ? "#ecfdf5" : "#fef2f2", color: c.is_active ? "#065f46" : "#dc2626", border: `1px solid ${c.is_active ? "#a7f3d0" : "#fecaca"}` }}>
                                            {c.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: "10px", color: "rgba(45,50,62,0.5)", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</p>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                                        <p style={{ fontSize: "10px", color: "rgba(45,50,62,0.5)" }}>
                                            {c.order_count} orders · <strong style={{ color: "#0A0A0A" }}>${c.total_spent.toFixed(2)}</strong> · {fmt(c.joined_at)}
                                        </p>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <Link href={route("admin.customers.show", c.id)} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#0A0A0A", textDecoration: "none", borderBottom: "1px solid #0A0A0A", paddingBottom: "1px" }}>View</Link>
                                            <button onClick={() => handleToggle(c.id, c.name, c.is_active)} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", background: "none", border: "none", borderBottom: `1px solid ${c.is_active ? "#dc2626" : "#16a34a"}`, paddingBottom: "1px", color: c.is_active ? "#dc2626" : "#16a34a", cursor: "pointer" }}>
                                                {c.is_active ? "Deactivate" : "Activate"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* ── DESKTOP ROW ── */}
                                <div className="cust-desktop" style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 80px 100px 120px 100px 100px", gap: "0", alignItems: "center", padding: "14px 20px" }}>
                                    <div>
                                        <Link href={route("admin.customers.show", c.id)}
                                            style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#0A0A0A", textDecoration: "none", borderBottom: "1px solid transparent" }}
                                            onMouseOver={e => (e.currentTarget.style.borderBottomColor = "#0A0A0A")}
                                            onMouseOut={e  => (e.currentTarget.style.borderBottomColor = "transparent")}>
                                            {c.name}
                                        </Link>
                                        {c.phone && <p style={{ fontSize: "9px", color: "rgba(45,50,62,0.35)", fontWeight: 500, marginTop: "2px" }}>{c.phone}</p>}
                                    </div>
                                    <p style={{ fontSize: "10px", fontWeight: 500, color: "rgba(45,50,62,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{c.email}</p>
                                    <p style={{ fontSize: "13px", fontWeight: 900, color: "#0A0A0A" }}>{c.order_count}</p>
                                    <p style={{ fontSize: "12px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>${c.total_spent.toFixed(2)}</p>
                                    <p style={{ fontSize: "9px", fontWeight: 600, color: "rgba(45,50,62,0.4)" }}>{fmt(c.joined_at)}</p>
                                    <span style={{ display: "inline-block", padding: "3px 10px", fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", backgroundColor: c.is_active ? "#ecfdf5" : "#fef2f2", color: c.is_active ? "#065f46" : "#dc2626", border: `1px solid ${c.is_active ? "#a7f3d0" : "#fecaca"}`, width: "fit-content" }}>
                                        {c.is_active ? "Active" : "Inactive"}
                                    </span>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <Link href={route("admin.customers.show", c.id)} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#0A0A0A", textDecoration: "none", borderBottom: "1px solid #0A0A0A", paddingBottom: "1px" }}>View</Link>
                                        <button onClick={() => handleToggle(c.id, c.name, c.is_active)} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", background: "none", border: "none", borderBottom: `1px solid ${c.is_active ? "#dc2626" : "#16a34a"}`, paddingBottom: "1px", color: c.is_active ? "#dc2626" : "#16a34a", cursor: "pointer" }}>
                                            {c.is_active ? "Deactivate" : "Activate"}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Pagination data={customers} />

            <style>{`
                .cust-header  { display: none; }
                .cust-mobile  { display: block; }
                .cust-desktop { display: none !important; }
                @media (min-width: 768px) {
                    .cust-header  { display: block; }
                    .cust-mobile  { display: none; }
                    .cust-desktop { display: grid !important; }
                }
            `}</style>
        </AdminLayout>
    );
}
