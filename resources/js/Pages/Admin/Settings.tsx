import React, { useState, useRef, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Brand    { id: number; name: string; logo_url: string | null }
interface Category { id: number; name: string }
interface Gender   { id: number; name: string }
interface Color    { id: number; name: string; hex_code: string | null }

interface Props {
    brands: Brand[];
    categories: Category[];
    genders: Gender[];
    colors: Color[];
    shippingFee: number;
    admin: { name: string };
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const input: React.CSSProperties = {
    border: "1px solid #e5e7eb", padding: "8px 12px", fontSize: "12px",
    fontWeight: 700, outline: "none", backgroundColor: "#fff",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
    padding: "8px 16px", backgroundColor: "#5B8C5A", color: "#fff",
    fontSize: "9px", fontWeight: 900, textTransform: "uppercase",
    letterSpacing: "0.12em", border: "none", cursor: "pointer",
    fontFamily: "inherit", whiteSpace: "nowrap",
};
const btnGhost: React.CSSProperties = {
    padding: "8px 14px", backgroundColor: "transparent", color: "rgba(45,50,62,0.5)",
    fontSize: "9px", fontWeight: 900, textTransform: "uppercase",
    letterSpacing: "0.12em", border: "1px solid #e5e7eb", cursor: "pointer",
    fontFamily: "inherit", whiteSpace: "nowrap",
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminSettings({ brands, categories, genders, colors, shippingFee, admin }: Props) {
    const { flash }: any = usePage().props;
    const [feeValue, setFeeValue] = useState(String(shippingFee));
    const [feeSaving, setFeeSaving] = useState(false);

    const saveShippingFee = () => {
        setFeeSaving(true);
        router.patch(route('admin.settings.shippingFee'), { shipping_fee: feeValue }, {
            preserveScroll: true,
            onFinish: () => setFeeSaving(false),
        });
    };

    return (
        <AdminLayout adminName={admin.name} active="settings" pageTitle="Settings" pageLabel="Catalog">
            <Head title="Admin — Settings" />

            {/* ── SHIPPING FEE ── */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "28px 32px", marginBottom: "24px" }}>
                <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.2em", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #f5f5f5" }}>
                    Shipping Fee
                </p>
                <p style={{ fontSize: "10px", color: "rgba(45,50,62,0.5)", marginBottom: "16px", fontWeight: 600 }}>
                    This flat rate is added to every order at checkout. Set to 0 for free shipping.
                </p>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", maxWidth: "320px" }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.2em", color: "rgba(45,50,62,0.5)", marginBottom: "6px", display: "block" }}>
                            Fee Amount (USD)
                        </label>
                        <div style={{ position: "relative" as const }}>
                            <span style={{ position: "absolute" as const, left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontWeight: 700, color: "rgba(45,50,62,0.4)" }}>$</span>
                            <input
                                type="number" min="0" max="9999" step="0.01"
                                value={feeValue}
                                onChange={e => setFeeValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveShippingFee()}
                                style={{ ...input, paddingLeft: "28px", width: "100%" }}
                            />
                        </div>
                    </div>
                    <button onClick={saveShippingFee} disabled={feeSaving} style={{ ...btnPrimary, opacity: feeSaving ? 0.5 : 1 }}>
                        {feeSaving ? "Saving..." : "Save"}
                    </button>
                </div>
                {shippingFee === 0 && (
                    <p style={{ fontSize: "9px", fontWeight: 700, color: "#065f46", marginTop: "10px", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                        ✓ Free shipping is currently active
                    </p>
                )}
                {shippingFee > 0 && (
                    <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(45,50,62,0.4)", marginTop: "10px", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                        Currently: ${shippingFee.toFixed(2)} per order
                    </p>
                )}
            </div>

            {flash?.success && (
                <div style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", padding: "12px 20px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#065f46", marginBottom: "20px" }}>
                    ✓ {flash.success}
                </div>
            )}

            {/* 2×2 grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <EntityPanel<Brand>
                    title="Brands"
                    type="brand"
                    items={brands}
                    renderItem={(b) => (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                            {b.logo_url
                                ? <img src={b.logo_url} alt={b.name} style={{ width: "28px", height: "28px", objectFit: "contain", mixBlendMode: "multiply", flexShrink: 0 }} />
                                : <div style={{ width: "28px", height: "28px", backgroundColor: "#f3f4f6", flexShrink: 0 }} />
                            }
                            <span style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                        </div>
                    )}
                    renderAddForm={(onSave, onCancel) => <BrandAddForm onSave={onSave} onCancel={onCancel} />}
                    renderEditForm={(item, onSave, onCancel) => <BrandEditForm item={item} onSave={onSave} onCancel={onCancel} />}
                />

                <EntityPanel<Category>
                    title="Categories"
                    type="category"
                    items={categories}
                    renderItem={(c) => (
                        <span style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{c.name}</span>
                    )}
                    renderAddForm={(onSave, onCancel) => <SimpleAddForm type="category" label="Category name" onSave={onSave} onCancel={onCancel} />}
                    renderEditForm={(item, onSave, onCancel) => <SimpleEditForm item={item} type="category" label="Category name" onSave={onSave} onCancel={onCancel} />}
                />

                <EntityPanel<Gender>
                    title="Genders"
                    type="gender"
                    items={genders}
                    renderItem={(g) => (
                        <span style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{g.name}</span>
                    )}
                    renderAddForm={(onSave, onCancel) => <SimpleAddForm type="gender" label="Gender name" onSave={onSave} onCancel={onCancel} />}
                    renderEditForm={(item, onSave, onCancel) => <SimpleEditForm item={item} type="gender" label="Gender name" onSave={onSave} onCancel={onCancel} />}
                />

                <EntityPanel<Color>
                    title="Colors"
                    type="color"
                    items={colors}
                    renderItem={(c) => (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: c.hex_code ?? "#e5e7eb", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                            <span style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{c.name}</span>
                            {c.hex_code && <span style={{ fontSize: "9px", fontWeight: 700, color: "rgba(45,50,62,0.35)", letterSpacing: "0.05em", fontFamily: "monospace" }}>{c.hex_code}</span>}
                        </div>
                    )}
                    renderAddForm={(onSave, onCancel) => <ColorAddForm onSave={onSave} onCancel={onCancel} />}
                    renderEditForm={(item, onSave, onCancel) => <ColorEditForm item={item as Color} onSave={onSave} onCancel={onCancel} />}
                />
            </div>
        </AdminLayout>
    );
}

// ── Generic Entity Panel ──────────────────────────────────────────────────────
function EntityPanel<T extends { id: number; name: string }>({
    title, type, items, renderItem, renderAddForm, renderEditForm,
}: {
    title: string;
    type: string;
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    renderAddForm: (onSave: () => void, onCancel: () => void) => React.ReactNode;
    renderEditForm: (item: T, onSave: () => void, onCancel: () => void) => React.ReactNode;
}) {
    const [adding,      setAdding]      = useState(false);
    const [editingId,   setEditingId]   = useState<number | null>(null);
    const [deletingId,  setDeletingId]  = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleDelete = (id: number) => {
        setDeleteError(null);
        router.delete(route("admin.settings.destroy", { type, id }), {
            preserveScroll: true,
            onSuccess: () => setDeletingId(null),
            onError: (e) => setDeleteError(e.delete ?? "Something went wrong. Please try again."),
        });
    };

    return (
        <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0" }}>
            {/* Panel header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #f0f0f0" }}>
                <div>
                    <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em" }}>{title}</p>
                    <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(45,50,62,0.35)", letterSpacing: "0.1em", marginTop: "2px" }}>
                        {items.length} {items.length === 1 ? "item" : "items"}
                    </p>
                </div>
                {!adding && (
                    <button onClick={() => { setAdding(true); setEditingId(null); }} style={btnPrimary}>
                        + Add
                    </button>
                )}
            </div>

            {/* Add form */}
            {adding && (
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", backgroundColor: "#fafafa" }}>
                    {renderAddForm(
                        () => setAdding(false),
                        () => setAdding(false),
                    )}
                </div>
            )}

            {/* List */}
            <div>
                {items.length === 0 && !adding && (
                    <div style={{ padding: "32px 20px", textAlign: "center" }}>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.2)" }}>
                            No {title.toLowerCase()} yet
                        </p>
                    </div>
                )}

                {items.map((item) => (
                    <div key={item.id} style={{ borderBottom: "1px solid #fafafa" }}>
                        {editingId === item.id ? (
                            <div style={{ padding: "12px 20px", backgroundColor: "#fafafa" }}>
                                {renderEditForm(
                                    item,
                                    () => setEditingId(null),
                                    () => setEditingId(null),
                                )}
                            </div>
                        ) : deletingId === item.id ? (
                            /* Inline delete confirmation */
                            <div style={{ backgroundColor: "#fef2f2", borderLeft: "3px solid #dc2626" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px" }}>
                                    <p style={{ fontSize: "10px", fontWeight: 700, color: "#991b1b" }}>
                                        Delete <strong>"{item.name}"</strong>? This cannot be undone.
                                    </p>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            style={{ ...btnPrimary, backgroundColor: "#dc2626" }}
                                        >
                                            Delete
                                        </button>
                                        <button onClick={() => { setDeletingId(null); setDeleteError(null); }} style={btnGhost}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                                {deleteError && (
                                    <div style={{ padding: "8px 20px 12px", borderTop: "1px solid #fecaca" }}>
                                        <p style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626" }}>
                                            ✕ {deleteError}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Normal display row */
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 20px" }}>
                                <div style={{ flex: 1, minWidth: 0, marginRight: "12px" }}>
                                    {renderItem(item)}
                                </div>
                                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                    <button
                                        onClick={() => { setEditingId(item.id); setAdding(false); setDeletingId(null); }}
                                        title="Edit"
                                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", border: "1px solid #e5e7eb", backgroundColor: "#fff", cursor: "pointer", color: "rgba(45,50,62,0.5)" }}
                                    >
                                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => { setDeletingId(item.id); setEditingId(null); }}
                                        title="Delete"
                                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", border: "1px solid #fecaca", backgroundColor: "#fef2f2", cursor: "pointer", color: "#dc2626" }}
                                    >
                                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Simple add/edit forms (category, gender) ──────────────────────────────────
function SimpleAddForm({ type, label, onSave, onCancel }: { type: string; label: string; onSave: () => void; onCancel: () => void }) {
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.focus(); }, []);

    const submit = () => {
        if (!name.trim()) { setError("Name is required"); return; }
        router.post(route("admin.settings.store", { type }), { name }, {
            preserveScroll: true,
            onSuccess: () => { setName(""); onSave(); },
            onError: (e) => setError(e.name ?? "Something went wrong"),
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
                <input
                    ref={ref}
                    style={input}
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
                    placeholder={label}
                />
                <button onClick={submit} style={btnPrimary}>Save</button>
                <button onClick={onCancel} style={btnGhost}>Cancel</button>
            </div>
            {error && <p style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>{error}</p>}
        </div>
    );
}

function SimpleEditForm({ item, type, label, onSave, onCancel }: { item: { id: number; name: string }; type: string; label: string; onSave: () => void; onCancel: () => void }) {
    const [name, setName] = useState(item.name);
    const [error, setError] = useState("");
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.focus(); }, []);

    const submit = () => {
        if (!name.trim()) { setError("Name is required"); return; }
        router.patch(route("admin.settings.update", { type, id: item.id }), { name }, {
            preserveScroll: true,
            onSuccess: () => onSave(),
            onError: (e) => setError(e.name ?? "Something went wrong"),
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
                <input
                    ref={ref}
                    style={input}
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
                    placeholder={label}
                />
                <button onClick={submit} style={btnPrimary}>Save</button>
                <button onClick={onCancel} style={btnGhost}>Cancel</button>
            </div>
            {error && <p style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>{error}</p>}
        </div>
    );
}

// ── Brand forms ───────────────────────────────────────────────────────────────
function BrandAddForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
    const [name,    setName]    = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [errors,  setErrors]  = useState<Record<string, string>>({});
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.focus(); }, []);

    const submit = () => {
        router.post(route("admin.settings.store", { type: "brand" }), { name, logo_url: logoUrl || null }, {
            preserveScroll: true,
            onSuccess: () => { setName(""); setLogoUrl(""); onSave(); },
            onError: (e) => setErrors(e),
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
                <input ref={ref} style={{ ...input, flex: "1" }} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }} placeholder="Brand name" />
                <button onClick={submit} style={btnPrimary}>Save</button>
                <button onClick={onCancel} style={btnGhost}>Cancel</button>
            </div>
            <input style={input} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo URL (optional)" />
            {errors.name     && <p style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>{errors.name}</p>}
            {errors.logo_url && <p style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>{errors.logo_url}</p>}
        </div>
    );
}

function BrandEditForm({ item, onSave, onCancel }: { item: { id: number; name: string; logo_url?: string | null }; onSave: () => void; onCancel: () => void }) {
    const [name,    setName]    = useState(item.name);
    const [logoUrl, setLogoUrl] = useState((item as any).logo_url ?? "");
    const [errors,  setErrors]  = useState<Record<string, string>>({});
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.focus(); }, []);

    const submit = () => {
        router.patch(route("admin.settings.update", { type: "brand", id: item.id }), { name, logo_url: logoUrl || null }, {
            preserveScroll: true,
            onSuccess: () => onSave(),
            onError: (e) => setErrors(e),
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
                <input ref={ref} style={{ ...input, flex: "1" }} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }} placeholder="Brand name" />
                <button onClick={submit} style={btnPrimary}>Save</button>
                <button onClick={onCancel} style={btnGhost}>Cancel</button>
            </div>
            <input style={input} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo URL (optional)" />
            {errors.name     && <p style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>{errors.name}</p>}
            {errors.logo_url && <p style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>{errors.logo_url}</p>}
        </div>
    );
}

// ── Color forms ───────────────────────────────────────────────────────────────
function ColorAddForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
    const [name,    setName]    = useState("");
    const [hexCode, setHexCode] = useState("#000000");
    const [errors,  setErrors]  = useState<Record<string, string>>({});
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.focus(); }, []);

    const submit = () => {
        router.post(route("admin.settings.store", { type: "color" }), { name, hex_code: hexCode }, {
            preserveScroll: true,
            onSuccess: () => { setName(""); setHexCode("#000000"); onSave(); },
            onError: (e) => setErrors(e),
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {/* Live swatch + color picker */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: hexCode, border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer" }} onClick={() => document.getElementById("color-add-picker")?.click()} />
                    <input id="color-add-picker" type="color" value={hexCode} onChange={(e) => setHexCode(e.target.value)} style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }} />
                </div>
                <input ref={ref} style={{ ...input, flex: "1" }} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }} placeholder="Color name (e.g. Volt Yellow)" />
                <input style={{ ...input, width: "100px", fontFamily: "monospace", fontSize: "11px" }} value={hexCode} onChange={(e) => setHexCode(e.target.value)} placeholder="#000000" />
                <button onClick={submit} style={btnPrimary}>Save</button>
                <button onClick={onCancel} style={btnGhost}>Cancel</button>
            </div>
            {errors.name     && <p style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>{errors.name}</p>}
            {errors.hex_code && <p style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>{errors.hex_code}</p>}
        </div>
    );
}

function ColorEditForm({ item, onSave, onCancel }: { item: Color; onSave: () => void; onCancel: () => void }) {
    const [name,    setName]    = useState(item.name);
    const [hexCode, setHexCode] = useState(item.hex_code ?? "#000000");
    const [errors,  setErrors]  = useState<Record<string, string>>({});
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.focus(); }, []);

    const submit = () => {
        router.patch(route("admin.settings.update", { type: "color", id: item.id }), { name, hex_code: hexCode }, {
            preserveScroll: true,
            onSuccess: () => onSave(),
            onError: (e) => setErrors(e),
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: hexCode, border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer" }} onClick={() => document.getElementById(`color-edit-picker-${item.id}`)?.click()} />
                    <input id={`color-edit-picker-${item.id}`} type="color" value={hexCode} onChange={(e) => setHexCode(e.target.value)} style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }} />
                </div>
                <input ref={ref} style={{ ...input, flex: "1" }} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }} placeholder="Color name" />
                <input style={{ ...input, width: "100px", fontFamily: "monospace", fontSize: "11px" }} value={hexCode} onChange={(e) => setHexCode(e.target.value)} placeholder="#000000" />
                <button onClick={submit} style={btnPrimary}>Save</button>
                <button onClick={onCancel} style={btnGhost}>Cancel</button>
            </div>
            {errors.name     && <p style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>{errors.name}</p>}
            {errors.hex_code && <p style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>{errors.hex_code}</p>}
        </div>
    );
}
