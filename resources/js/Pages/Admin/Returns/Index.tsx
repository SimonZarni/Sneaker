import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";

interface ReturnRow {
    id: number;
    order_id: number;
    order_number: string;
    customer_name: string;
    customer_email: string;
    item_count: number;
    status: string;
    refund_method: string;
    refund_amount: string | null;
    requested_at: string;
}

interface Stats {
    pending: number;
    approved: number;
    rejected: number;
    refunded: number;
}

interface Props {
    returns: { data: ReturnRow[]; links: any[]; meta: any };
    stats: Stats;
    filters: { status?: string };
    admin: { name: string };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
    Pending:  { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    Approved: { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
    Rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    Refunded: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
};

function StatusPill({ label }: { label: string }) {
    const s = STATUS_STYLES[label] ?? { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" };
    return (
        <span style={{
            display: "inline-block", padding: "3px 10px", fontSize: "9px",
            fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
            backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
        }}>
            {label}
        </span>
    );
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtPrice(val: string | number | null) {
    if (val === null || val === undefined) return "—";
    return `$${parseFloat(String(val)).toFixed(2)}`;
}

export default function AdminReturnsIndex({ returns, stats, filters, admin }: Props) {
    const { flash }: any = usePage().props;
    const statuses = ["Pending", "Approved", "Rejected", "Refunded"];

    const setFilter = (status: string | null) => {
        router.get(route("admin.returns.index"), status ? { status } : {}, { preserveScroll: true });
    };

    const statCards = [
        { label: "Pending",  count: stats.pending,  color: "#b45309" },
        { label: "Approved", count: stats.approved, color: "#065f46" },
        { label: "Rejected", count: stats.rejected, color: "#dc2626" },
        { label: "Refunded", count: stats.refunded, color: "#6d28d9" },
    ];

    return (
        <AdminLayout
            adminName={admin.name}
            active="returns"
            pageLabel="Operations"
            pageTitle="Returns"
        >
            <Head title="Returns — Admin" />

            {/* Flash */}
            {flash?.success && (
                <div style={{ marginBottom: 20, padding: "12px 16px", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", fontSize: 11, fontWeight: 700 }}>
                    {flash.success}
                </div>
            )}

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                {statCards.map(s => (
                    <button
                        key={s.label}
                        onClick={() => setFilter(filters.status === s.label ? null : s.label)}
                        style={{
                            background: "#fff", border: `1px solid ${filters.status === s.label ? s.color : "#f0f0f0"}`,
                            padding: "16px 20px", textAlign: "left", cursor: "pointer",
                            boxShadow: filters.status === s.label ? `0 0 0 2px ${s.color}20` : "none",
                        }}
                    >
                        <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#9ca3af", marginBottom: 6 }}>{s.label}</p>
                        <p style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.count}</p>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <button
                    onClick={() => setFilter(null)}
                    style={{
                        padding: "6px 14px", fontSize: 9, fontWeight: 900, textTransform: "uppercase",
                        letterSpacing: "0.15em", cursor: "pointer",
                        background: !filters.status ? "#0A0A0A" : "#fff",
                        color: !filters.status ? "#fff" : "#6b7280",
                        border: "1px solid #e5e7eb",
                    }}
                >All</button>
                {statuses.map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        style={{
                            padding: "6px 14px", fontSize: 9, fontWeight: 900, textTransform: "uppercase",
                            letterSpacing: "0.15em", cursor: "pointer",
                            background: filters.status === s ? "#0A0A0A" : "#fff",
                            color: filters.status === s ? "#fff" : "#6b7280",
                            border: "1px solid #e5e7eb",
                        }}
                    >{s}</button>
                ))}
            </div>

            {/* Table */}
            <div style={{ background: "#fff", border: "1px solid #f0f0f0" }}>
                {returns.data.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        No return requests found
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                                {["Order", "Customer", "Items", "Refund Method", "Refund Amount", "Status", "Requested", ""].map(h => (
                                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#9ca3af" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {returns.data.map(r => (
                                <tr key={r.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                                    <td style={{ padding: "14px 16px" }}>
                                        <Link href={route("admin.returns.show", r.id)} style={{ fontSize: 11, fontWeight: 900, color: "#0A0A0A", textDecoration: "none" }}>
                                            {r.order_number}
                                        </Link>
                                    </td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: "#0A0A0A" }}>{r.customer_name}</p>
                                        <p style={{ fontSize: 9, color: "#9ca3af" }}>{r.customer_email}</p>
                                    </td>
                                    <td style={{ padding: "14px 16px", fontSize: 11, fontWeight: 700 }}>{r.item_count}</td>
                                    <td style={{ padding: "14px 16px", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.refund_method}</td>
                                    <td style={{ padding: "14px 16px", fontSize: 11, fontWeight: 900 }}>{fmtPrice(r.refund_amount)}</td>
                                    <td style={{ padding: "14px 16px" }}><StatusPill label={r.status} /></td>
                                    <td style={{ padding: "14px 16px", fontSize: 10, color: "#9ca3af" }}>{fmtDate(r.requested_at)}</td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <Link
                                            href={route("admin.returns.show", r.id)}
                                            style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#0A0A0A", textDecoration: "none", borderBottom: "1px solid currentColor" }}
                                        >
                                            Review →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {returns.meta?.last_page > 1 && (
                <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "center" }}>
                    {returns.links.map((link: any, i: number) => (
                        link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                style={{
                                    padding: "6px 12px", fontSize: 10, fontWeight: 700,
                                    background: link.active ? "#0A0A0A" : "#fff",
                                    color: link.active ? "#fff" : "#6b7280",
                                    border: "1px solid #e5e7eb", textDecoration: "none",
                                }}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span key={i} style={{ padding: "6px 12px", fontSize: 10, color: "#d1d5db" }} dangerouslySetInnerHTML={{ __html: link.label }} />
                        )
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
