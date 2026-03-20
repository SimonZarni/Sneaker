import React, { useState, useRef } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";

interface Variant {
    id: number;
    product_id: number;
    product_name: string;
    brand_name: string;
    color_name: string;
    color_hex: string;
    size_value: string;
    stock_quantity: number;
    variant_price: string | null;
}

interface Stats {
    total: number;
    out: number;
    low: number;
    healthy: number;
}

interface Props {
    variants: { data: Variant[]; current_page: number; last_page: number; total: number; per_page: number };
    stats: Stats;
    filters: { filter: string; search: string };
    admin: { name: string };
}

export default function AdminInventoryIndex({ variants, stats, filters, admin }: Props) {
    const { flash }: any = usePage().props;

    const [search, setSearch]       = useState(filters.search);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const apply = (params: Record<string, string>) => {
        router.get(route('admin.inventory.index'), { ...filters, ...params }, { preserveScroll: true, replace: true });
    };

    const startEdit = (v: Variant) => {
        setEditingId(v.id);
        setEditValue(String(v.stock_quantity));
        setTimeout(() => inputRef.current?.select(), 50);
    };

    const saveEdit = (id: number) => {
        const qty = parseInt(editValue);
        if (isNaN(qty) || qty < 0) { setEditingId(null); return; }
        router.patch(route('admin.inventory.updateStock', id), { stock_quantity: qty }, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
        if (e.key === 'Enter')  saveEdit(id);
        if (e.key === 'Escape') setEditingId(null);
    };

    const stockStatus = (qty: number) => {
        if (qty === 0) return { label: 'Out',     bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
        if (qty <= 5)  return { label: 'Low',     bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
        return              { label: 'In Stock', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' };
    };

    const filterTabs = [
        { value: 'all',     label: 'All',        count: stats.total   },
        { value: 'out',     label: 'Out of Stock', count: stats.out   },
        { value: 'low',     label: 'Low Stock',  count: stats.low     },
        { value: 'healthy', label: 'In Stock',   count: stats.healthy },
    ];

    return (
        <AdminLayout adminName={admin.name} active="inventory" pageTitle="Inventory" pageLabel="Stock Management">
            <Head title="Inventory — Admin" />

            {flash?.success && (
                <div style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", padding: "12px 20px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#065f46", marginBottom: "20px" }}>
                    ✓ {flash.success}
                </div>
            )}

            {/* ── STAT CARDS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {[
                    { label: "Total Variants", value: stats.total,   bg: "#0A0A0A", text: "#fff",     sub: "rgba(255,255,255,0.4)" },
                    { label: "Out of Stock",   value: stats.out,     bg: "#fef2f2", text: "#dc2626",  sub: "rgba(220,38,38,0.5)"   },
                    { label: "Low Stock",      value: stats.low,     bg: "#fffbeb", text: "#d97706",  sub: "rgba(217,119,6,0.5)"   },
                    { label: "Healthy",        value: stats.healthy, bg: "#ecfdf5", text: "#065f46",  sub: "rgba(6,95,70,0.5)"     },
                ].map(card => (
                    <div key={card.label} style={{ backgroundColor: card.bg, padding: "24px 28px" }}>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.3em", color: card.sub, marginBottom: "8px" }}>
                            {card.label}
                        </p>
                        <p style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.05em", color: card.text, fontVariantNumeric: "tabular-nums" }}>
                            {card.value.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── FILTERS ── */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", marginBottom: "2px" }}>
                <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" as const }}>
                    {/* Filter tabs */}
                    <div style={{ display: "flex", gap: "4px" }}>
                        {filterTabs.map(tab => {
                            const active = filters.filter === tab.value;
                            return (
                                <button key={tab.value} onClick={() => apply({ filter: tab.value, search })}
                                    style={{ padding: "8px 16px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", border: `1px solid ${active ? "#0A0A0A" : "#e5e7eb"}`, backgroundColor: active ? "#0A0A0A" : "#fff", color: active ? "#fff" : "rgba(45,50,62,0.5)", cursor: "pointer" }}>
                                    {tab.label}
                                    <span style={{ marginLeft: "6px", fontSize: "8px", opacity: 0.6 }}>({tab.count})</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search */}
                    <div style={{ display: "flex", gap: "8px" }}>
                        <input
                            type="text" placeholder="Search product name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && apply({ search, filter: filters.filter })}
                            style={{ border: "1px solid #e5e7eb", padding: "8px 14px", fontSize: "12px", outline: "none", width: "220px", fontFamily: "inherit" }}
                        />
                        <button onClick={() => apply({ search, filter: filters.filter })}
                            style={{ padding: "8px 20px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", border: "none", cursor: "pointer" }}>
                            Search
                        </button>
                        {(filters.search || filters.filter !== 'all') && (
                            <button onClick={() => { setSearch(''); apply({ filter: 'all', search: '' }); }}
                                style={{ padding: "8px 14px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", border: "1px solid #e5e7eb", backgroundColor: "#fff", color: "rgba(45,50,62,0.4)", cursor: "pointer" }}>
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── TABLE ── */}
            <div style={{ border: "1px solid #f0f0f0", backgroundColor: "#fff" }}>
                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px 100px 110px 120px", gap: "16px", padding: "10px 24px", backgroundColor: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                    {["Product", "Brand", "Color", "Size", "Price", "Stock", ""].map(h => (
                        <p key={h} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.2em", color: "rgba(45,50,62,0.3)" }}>{h}</p>
                    ))}
                </div>

                {variants.data.length === 0 ? (
                    <div style={{ padding: "60px 24px", textAlign: "center", fontSize: "10px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.2em", color: "rgba(45,50,62,0.2)" }}>
                        No variants match your filters
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: "1px", backgroundColor: "#f0f0f0" }}>
                        {variants.data.map(v => {
                            const status = stockStatus(v.stock_quantity);
                            const isEditing = editingId === v.id;
                            return (
                                <div key={v.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px 100px 110px 120px", gap: "16px", alignItems: "center", padding: "13px 24px", backgroundColor: "#fff" }}>

                                    {/* Product */}
                                    <p style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                        {v.product_name}
                                    </p>

                                    {/* Brand */}
                                    <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(45,50,62,0.5)", textTransform: "uppercase" as const }}>
                                        {v.brand_name}
                                    </p>

                                    {/* Color */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: v.color_hex, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                                        <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(45,50,62,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                            {v.color_name}
                                        </span>
                                    </div>

                                    {/* Size */}
                                    <p style={{ fontSize: "11px", fontWeight: 900, color: "rgba(45,50,62,0.7)" }}>
                                        US {v.size_value}
                                    </p>

                                    {/* Price */}
                                    <p style={{ fontSize: "11px", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "rgba(45,50,62,0.5)" }}>
                                        {v.variant_price ? `$${parseFloat(v.variant_price).toFixed(2)}` : "—"}
                                    </p>

                                    {/* Stock — inline edit */}
                                    <div>
                                        {isEditing ? (
                                            <input
                                                ref={inputRef}
                                                type="number" min="0" max="9999"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                onKeyDown={e => handleKeyDown(e, v.id)}
                                                onBlur={() => saveEdit(v.id)}
                                                style={{ width: "70px", border: "2px solid #0A0A0A", padding: "4px 8px", fontSize: "12px", fontWeight: 900, outline: "none", fontFamily: "inherit", fontVariantNumeric: "tabular-nums" }}
                                                autoFocus
                                            />
                                        ) : (
                                            <span
                                                onClick={() => startEdit(v)}
                                                title="Click to edit stock"
                                                style={{
                                                    display: "inline-block", padding: "3px 10px",
                                                    fontSize: "11px", fontWeight: 900,
                                                    fontVariantNumeric: "tabular-nums",
                                                    backgroundColor: status.bg, color: status.color,
                                                    border: `1px solid ${status.border}`,
                                                    cursor: "pointer",
                                                }}>
                                                {v.stock_quantity === 0 ? "Out" : v.stock_quantity}
                                            </span>
                                        )}
                                    </div>

                                    {/* Edit link */}
                                    <Link href={route("admin.products.edit", v.product_id)}
                                        style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)", textDecoration: "none", borderBottom: "1px solid currentColor", paddingBottom: "1px", width: "fit-content" }}>
                                        Edit Product →
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {variants.last_page > 1 && (
                    <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(45,50,62,0.4)", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                            Showing {((variants.current_page - 1) * variants.per_page) + 1}–{Math.min(variants.current_page * variants.per_page, variants.total)} of {variants.total}
                        </p>
                        <div style={{ display: "flex", gap: "4px" }}>
                            {variants.current_page > 1 && (
                                <button onClick={() => apply({ filter: filters.filter, search, page: String(variants.current_page - 1) })}
                                    style={{ padding: "6px 14px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", border: "1px solid #e5e7eb", backgroundColor: "#fff", cursor: "pointer" }}>
                                    ← Prev
                                </button>
                            )}
                            {variants.current_page < variants.last_page && (
                                <button onClick={() => apply({ filter: filters.filter, search, page: String(variants.current_page + 1) })}
                                    style={{ padding: "6px 14px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", border: "1px solid #e5e7eb", backgroundColor: "#fff", cursor: "pointer" }}>
                                    Next →
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
