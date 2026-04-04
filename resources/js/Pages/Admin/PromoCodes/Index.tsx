import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";

interface PromoCode {
    id: number;
    code: string;
    type: "percentage" | "fixed";
    value: string;
    min_order_amount: string | null;
    max_uses: number | null;
    uses_count: number;
    per_user_limit: number | null;
    starts_at: string | null;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    promos: PromoCode[];
    admin: { name: string };
}

const input: React.CSSProperties = {
    border: "1px solid #e5e7eb", padding: "8px 12px", fontSize: "12px",
    fontWeight: 700, outline: "none", backgroundColor: "#fff",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const,
};
const btnPrimary: React.CSSProperties = {
    padding: "8px 16px", backgroundColor: "#0A0A0A", color: "#fff",
    fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const,
    letterSpacing: "0.12em", border: "none", cursor: "pointer",
    fontFamily: "inherit", whiteSpace: "nowrap" as const,
};
const btnGhost: React.CSSProperties = {
    padding: "8px 14px", backgroundColor: "transparent", color: "rgba(45,50,62,0.5)",
    fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const,
    letterSpacing: "0.12em", border: "1px solid #e5e7eb", cursor: "pointer",
    fontFamily: "inherit", whiteSpace: "nowrap" as const,
};

const emptyForm = {
    code: "", type: "percentage" as "percentage" | "fixed", value: "",
    min_order_amount: "", max_uses: "", per_user_limit: "",
    starts_at: "", expires_at: "", is_active: true,
};

export default function AdminPromoCodes({ promos, admin }: Props) {
    const { flash, errors }: any = usePage().props;
    const [showForm, setShowForm]   = useState(false);
    const [editing, setEditing]     = useState<PromoCode | null>(null);
    const [form, setForm]           = useState({ ...emptyForm });
    const [saving, setSaving]       = useState(false);
    const [deleting, setDeleting]   = useState<number | null>(null);

    const openCreate = () => {
        setEditing(null);
        setForm({ ...emptyForm });
        setShowForm(true);
    };

    const openEdit = (p: PromoCode) => {
        setEditing(p);
        setForm({
            code:             p.code,
            type:             p.type,
            value:            p.value,
            min_order_amount: p.min_order_amount ?? "",
            max_uses:         p.max_uses !== null ? String(p.max_uses) : "",
            per_user_limit:   p.per_user_limit !== null ? String(p.per_user_limit) : "",
            starts_at:        p.starts_at ? p.starts_at.slice(0, 10) : "",
            expires_at:       p.expires_at ? p.expires_at.slice(0, 10) : "",
            is_active:        p.is_active,
        });
        setShowForm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            ...form,
            min_order_amount: form.min_order_amount || null,
            max_uses:         form.max_uses || null,
            per_user_limit:   form.per_user_limit || null,
            starts_at:        form.starts_at || null,
            expires_at:       form.expires_at || null,
        };

        if (editing) {
            router.patch(route("admin.promo.update", editing.id), payload, {
                preserveScroll: true,
                onFinish: () => { setSaving(false); setShowForm(false); },
            });
        } else {
            router.post(route("admin.promo.store"), payload, {
                preserveScroll: true,
                onFinish: () => { setSaving(false); setShowForm(false); },
            });
        }
    };

    const handleToggle = (p: PromoCode) => {
        router.patch(route("admin.promo.toggle", p.id), {}, { preserveScroll: true });
    };

    const handleDelete = (p: PromoCode) => {
        if (!confirm(`Delete promo code "${p.code}"? This cannot be undone.`)) return;
        setDeleting(p.id);
        router.delete(route("admin.promo.destroy", p.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    const label: React.CSSProperties = {
        fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const,
        letterSpacing: "0.2em", color: "rgba(45,50,62,0.5)", marginBottom: "6px", display: "block",
    };

    return (
        <AdminLayout adminName={admin.name} active="promo" pageTitle="Promo Codes" pageLabel="Marketing">
            <Head title="Admin — Promo Codes" />

            {flash?.success && (
                <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", marginBottom: "20px", fontSize: "11px", fontWeight: 700, color: "#15803d" }}>
                    {flash.success}
                </div>
            )}

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <p style={{ fontSize: "11px", color: "rgba(45,50,62,0.5)", fontWeight: 600 }}>
                    {promos.length} code{promos.length !== 1 ? "s" : ""} total
                </p>
                <button style={btnPrimary} onClick={openCreate}>+ New Code</button>
            </div>

            {/* Create / Edit Form */}
            {showForm && (
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 20px", marginBottom: "24px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.2em", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #f5f5f5" }}>
                        {editing ? "Edit Promo Code" : "New Promo Code"}
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                            <div>
                                <label style={label}>Code</label>
                                <input style={input} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SUMMER20" required />
                                {errors?.code && <p style={{ fontSize: "10px", color: "#dc2626", marginTop: "4px" }}>{errors.code}</p>}
                            </div>
                            <div>
                                <label style={label}>Type</label>
                                <select style={input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount ($)</option>
                                </select>
                            </div>
                            <div>
                                <label style={label}>{form.type === "percentage" ? "Discount %" : "Discount Amount ($)"}</label>
                                <input style={input} type="number" min="0.01" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === "percentage" ? "e.g. 20" : "e.g. 10.00"} required />
                                {errors?.value && <p style={{ fontSize: "10px", color: "#dc2626", marginTop: "4px" }}>{errors.value}</p>}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                            <div>
                                <label style={label}>Min Order Amount ($) <span style={{ opacity: 0.5 }}>optional</span></label>
                                <input style={input} type="number" min="0" step="0.01" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} placeholder="No minimum" />
                            </div>
                            <div>
                                <label style={label}>Max Total Uses <span style={{ opacity: 0.5 }}>optional</span></label>
                                <input style={input} type="number" min="1" step="1" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" />
                            </div>
                            <div>
                                <label style={label}>Per-User Limit <span style={{ opacity: 0.5 }}>optional</span></label>
                                <input style={input} type="number" min="1" step="1" value={form.per_user_limit} onChange={e => setForm(f => ({ ...f, per_user_limit: e.target.value }))} placeholder="Unlimited" />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                            <div>
                                <label style={label}>Start Date <span style={{ opacity: 0.5 }}>optional</span></label>
                                <input style={input} type="date" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
                            </div>
                            <div>
                                <label style={label}>Expiry Date <span style={{ opacity: 0.5 }}>optional</span></label>
                                <input style={input} type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "2px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: "16px", height: "16px" }} />
                                    <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Active</span>
                                </label>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <button type="submit" style={btnPrimary} disabled={saving}>
                                {saving ? "Saving..." : editing ? "Update Code" : "Create Code"}
                            </button>
                            <button type="button" style={btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0" }}>
                {promos.length === 0 ? (
                    <div style={{ padding: "60px 20px", textAlign: "center" }}>
                        <p style={{ fontSize: "11px", color: "rgba(45,50,62,0.4)", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.2em" }}>No promo codes yet</p>
                        <p style={{ fontSize: "11px", color: "rgba(45,50,62,0.3)", marginTop: "8px" }}>Click "+ New Code" to create your first one.</p>
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #f5f5f5" }}>
                                {["Code", "Type", "Value", "Uses", "Min Order", "Expires", "Status", "Actions"].map(h => (
                                    <th key={h} style={{ padding: "12px 16px", textAlign: "left" as const, fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.2em", color: "rgba(45,50,62,0.4)" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {promos.map(p => (
                                <tr key={p.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                                    <td style={{ padding: "14px 16px", fontSize: "12px", fontWeight: 900, fontFamily: "monospace", letterSpacing: "0.05em" }}>{p.code}</td>
                                    <td style={{ padding: "14px 16px", fontSize: "10px", fontWeight: 700, color: "rgba(45,50,62,0.6)", textTransform: "uppercase" as const }}>{p.type}</td>
                                    <td style={{ padding: "14px 16px", fontSize: "12px", fontWeight: 800 }}>
                                        {p.type === "percentage" ? `${p.value}%` : `$${parseFloat(p.value).toFixed(2)}`}
                                    </td>
                                    <td style={{ padding: "14px 16px", fontSize: "11px", fontWeight: 700 }}>
                                        {p.uses_count}{p.max_uses !== null ? ` / ${p.max_uses}` : ""}
                                    </td>
                                    <td style={{ padding: "14px 16px", fontSize: "11px", fontWeight: 700, color: "rgba(45,50,62,0.6)" }}>
                                        {p.min_order_amount ? `$${parseFloat(p.min_order_amount).toFixed(2)}` : "—"}
                                    </td>
                                    <td style={{ padding: "14px 16px", fontSize: "11px", fontWeight: 700, color: "rgba(45,50,62,0.6)" }}>
                                        {p.expires_at ? new Date(p.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Bangkok" }) : "—"}
                                    </td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <span style={{
                                            fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const,
                                            letterSpacing: "0.1em", padding: "4px 8px",
                                            backgroundColor: p.is_active ? "#f0fdf4" : "#fef2f2",
                                            color: p.is_active ? "#15803d" : "#dc2626",
                                            border: `1px solid ${p.is_active ? "#bbf7d0" : "#fecaca"}`,
                                        }}>
                                            {p.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <div style={{ display: "flex", gap: "6px" }}>
                                            <button style={{ ...btnGhost, padding: "5px 10px" }} onClick={() => openEdit(p)}>Edit</button>
                                            <button style={{ ...btnGhost, padding: "5px 10px" }} onClick={() => handleToggle(p)}>
                                                {p.is_active ? "Disable" : "Enable"}
                                            </button>
                                            <button
                                                style={{ ...btnGhost, padding: "5px 10px", color: "#dc2626", borderColor: "#fecaca" }}
                                                onClick={() => handleDelete(p)}
                                                disabled={deleting === p.id}
                                            >
                                                {deleting === p.id ? "..." : "Delete"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AdminLayout>
    );
}
