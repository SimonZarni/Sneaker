import React, { useState, useCallback } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";

interface LookupItem { id: number; name: string }
interface ColorItem  { id: number; name: string; hex_code: string | null }
interface SizeItem   { id: number; size_value: string }

interface SizeEntry       { size_id: number; stock_quantity: number }
interface VariantRow      { _key: string; color_id: number | ""; image_url: string; variant_price: string; sizes: SizeEntry[] }

interface Props {
    brands: LookupItem[];
    categories: LookupItem[];
    genders: LookupItem[];
    colors: ColorItem[];
    sizes: SizeItem[];
    admin: { name: string };
}

// ── Shared field styles ───────────────────────────────────────────────────────
const S = {
    label:  { fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.2em", color: "rgba(45,50,62,0.5)", marginBottom: "6px", display: "block" },
    input:  { width: "100%", border: "1px solid #e5e7eb", padding: "11px 14px", fontSize: "13px", outline: "none", backgroundColor: "#fff", boxSizing: "border-box" as const },
    select: { width: "100%", border: "1px solid #e5e7eb", padding: "11px 14px", fontSize: "13px", outline: "none", backgroundColor: "#fff", boxSizing: "border-box" as const, cursor: "pointer" },
    error:  { fontSize: "10px", color: "#dc2626", fontWeight: 700, marginTop: "4px" },
    card:   { backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "28px 32px", marginBottom: "20px" },
    sectionTitle: { fontSize: "11px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.2em", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #f5f5f5" },
};

function newVariantRow(): VariantRow {
    return { _key: Math.random().toString(36).slice(2), color_id: "", image_url: "", variant_price: "", sizes: [] };
}

export default function AdminProductsCreate({ brands, categories, genders, colors, sizes, admin }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name:           "",
        brand_id:       "",
        category_id:    "",
        gender_id:      "",
        base_price:     "",
        description:    "",
        main_image_url: "",
        is_active:      true,
        variants:       [] as VariantRow[],
    });

    const [variants, setVariants] = useState<VariantRow[]>([]);

    const addVariant = () => setVariants((v) => [...v, newVariantRow()]);

    const removeVariant = (key: string) => setVariants((v) => v.filter((r) => r._key !== key));

    const updateVariant = (key: string, field: keyof Omit<VariantRow, "_key" | "sizes">, value: any) => {
        setVariants((v) => v.map((r) => r._key === key ? { ...r, [field]: value } : r));
    };

    const toggleSize = (key: string, sizeId: number) => {
        setVariants((v) => v.map((r) => {
            if (r._key !== key) return r;
            const exists = r.sizes.find((s) => s.size_id === sizeId);
            const sizes = exists
                ? r.sizes.filter((s) => s.size_id !== sizeId)
                : [...r.sizes, { size_id: sizeId, stock_quantity: 1 }];
            return { ...r, sizes };
        }));
    };

    const updateStock = (key: string, sizeId: number, qty: number) => {
        setVariants((v) => v.map((r) => {
            if (r._key !== key) return r;
            return { ...r, sizes: r.sizes.map((s) => s.size_id === sizeId ? { ...s, stock_quantity: qty } : s) };
        }));
    };

    const usedColorIds = variants.map((v) => v.color_id).filter(Boolean) as number[];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Strip _key before sending
        const payload = {
            ...data,
            variants: variants.map(({ _key, ...rest }) => rest),
        };
        router.post(route("admin.products.store"), payload as any);
    };

    const fieldError = (field: string) => (errors as any)[field];

    return (
        <AdminLayout
            adminName={admin.name}
            active="products"
            pageTitle="Add Product"
            pageLabel="Catalog"
            headerRight={
                <Link href={route("admin.products.index")} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)", textDecoration: "none" }}>
                    ← Back to Products
                </Link>
            }
        >
            <Head title="Admin — Add Product" />

            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>

                    {/* ── LEFT COLUMN ── */}
                    <div>

                        {/* Basic Info */}
                        <div style={S.card}>
                            <p style={S.sectionTitle}>Product Info</p>
                            <div style={{ display: "grid", gap: "18px" }}>

                                <div>
                                    <label style={S.label}>Product Name *</label>
                                    <input style={S.input} value={data.name} onChange={(e) => setData("name", e.target.value)} placeholder="e.g. Air Force 1 Low" />
                                    {fieldError("name") && <p style={S.error}>{fieldError("name")}</p>}
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                                    <div>
                                        <label style={S.label}>Brand *</label>
                                        <select style={S.select} value={data.brand_id} onChange={(e) => setData("brand_id", e.target.value)}>
                                            <option value="">Select brand</option>
                                            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                        {fieldError("brand_id") && <p style={S.error}>{fieldError("brand_id")}</p>}
                                    </div>
                                    <div>
                                        <label style={S.label}>Category *</label>
                                        <select style={S.select} value={data.category_id} onChange={(e) => setData("category_id", e.target.value)}>
                                            <option value="">Select category</option>
                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        {fieldError("category_id") && <p style={S.error}>{fieldError("category_id")}</p>}
                                    </div>
                                    <div>
                                        <label style={S.label}>Gender *</label>
                                        <select style={S.select} value={data.gender_id} onChange={(e) => setData("gender_id", e.target.value)}>
                                            <option value="">Select gender</option>
                                            {genders.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                        {fieldError("gender_id") && <p style={S.error}>{fieldError("gender_id")}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label style={S.label}>Description</label>
                                    <textarea
                                        style={{ ...S.input, minHeight: "90px", resize: "vertical", fontFamily: "inherit" }}
                                        value={data.description}
                                        onChange={(e) => setData("description", e.target.value)}
                                        placeholder="Product description..."
                                    />
                                </div>

                                <div>
                                    <label style={S.label}>Main Image URL</label>
                                    <input style={S.input} value={data.main_image_url} onChange={(e) => setData("main_image_url", e.target.value)} placeholder="https://..." />
                                    {fieldError("main_image_url") && <p style={S.error}>{fieldError("main_image_url")}</p>}
                                    {data.main_image_url && (
                                        <div style={{ marginTop: "10px", width: "80px", height: "80px", backgroundColor: "#f9fafb", border: "1px solid #f0f0f0" }}>
                                            <img src={data.main_image_url} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply", padding: "4px" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Variants */}
                        <div style={S.card}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #f5f5f5" }}>
                                <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em" }}>
                                    Colorways & Stock
                                </p>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer" }}
                                >
                                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Add Color
                                </button>
                            </div>

                            {variants.length === 0 && (
                                <div style={{ padding: "32px", textAlign: "center", border: "1px dashed #e5e7eb", backgroundColor: "#fafafa" }}>
                                    <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.3)", marginBottom: "12px" }}>
                                        No colorways added yet
                                    </p>
                                    <button type="button" onClick={addVariant} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#0A0A0A", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid #0A0A0A", paddingBottom: "1px" }}>
                                        + Add first colorway
                                    </button>
                                </div>
                            )}

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {variants.map((variant, idx) => (
                                    <VariantBuilder
                                        key={variant._key}
                                        variant={variant}
                                        index={idx}
                                        colors={colors}
                                        sizes={sizes}
                                        usedColorIds={usedColorIds.filter((id) => id !== variant.color_id)}
                                        onColorChange={(val) => updateVariant(variant._key, "color_id", val)}
                                        onImageChange={(val) => updateVariant(variant._key, "image_url", val)}
                                        onVariantPriceChange={(val) => updateVariant(variant._key, "variant_price", val)}
                                        onToggleSize={(sizeId) => toggleSize(variant._key, sizeId)}
                                        onUpdateStock={(sizeId, qty) => updateStock(variant._key, sizeId, qty)}
                                        onRemove={() => removeVariant(variant._key)}
                                        errors={errors}
                                        errorPrefix={`variants.${idx}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN ── */}
                    <div style={{ position: "sticky", top: "100px" }}>
                        <div style={S.card}>
                            <p style={S.sectionTitle}>Pricing & Status</p>
                            <div style={{ display: "grid", gap: "18px" }}>
                                <div>
                                    <label style={S.label}>Base Price (USD) *</label>
                                    <div style={{ position: "relative" }}>
                                        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontWeight: 700, color: "rgba(45,50,62,0.4)" }}>$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            style={{ ...S.input, paddingLeft: "28px" }}
                                            value={data.base_price}
                                            onChange={(e) => setData("base_price", e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {fieldError("base_price") && <p style={S.error}>{fieldError("base_price")}</p>}
                                </div>

                                <div>
                                    <label style={S.label}>Status</label>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        {[{ label: "Active", value: true }, { label: "Inactive", value: false }].map((opt) => (
                                            <button
                                                key={String(opt.value)}
                                                type="button"
                                                onClick={() => setData("is_active", opt.value)}
                                                style={{ flex: 1, padding: "10px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: `1px solid ${data.is_active === opt.value ? "#0A0A0A" : "#e5e7eb"}`, backgroundColor: data.is_active === opt.value ? "#0A0A0A" : "#fff", color: data.is_active === opt.value ? "#fff" : "rgba(45,50,62,0.5)", cursor: "pointer" }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Summary */}
                                <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderTop: "1px solid #f0f0f0" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)" }}>Colorways</span>
                                        <span style={{ fontSize: "12px", fontWeight: 900 }}>{variants.length}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)" }}>Total SKUs</span>
                                        <span style={{ fontSize: "12px", fontWeight: 900 }}>{variants.reduce((acc, v) => acc + v.sizes.length, 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            style={{ width: "100%", padding: "16px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", border: "none", cursor: processing ? "not-allowed" : "pointer", opacity: processing ? 0.5 : 1 }}
                        >
                            {processing ? "Creating..." : "Create Product"}
                        </button>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}

// ── Variant Builder Row ───────────────────────────────────────────────────────
function VariantBuilder({
    variant, index, colors, sizes, usedColorIds,
    onColorChange, onImageChange, onVariantPriceChange, onToggleSize, onUpdateStock, onRemove, errors, errorPrefix,
}: {
    variant: VariantRow;
    index: number;
    colors: ColorItem[];
    sizes: SizeItem[];
    usedColorIds: number[];
    onColorChange: (val: number | "") => void;
    onImageChange: (val: string) => void;
    onVariantPriceChange: (val: string) => void;
    onToggleSize: (sizeId: number) => void;
    onUpdateStock: (sizeId: number, qty: number) => void;
    onRemove: () => void;
    errors: any;
    errorPrefix: string;
}) {
    const selectedColor = colors.find((c) => c.id === variant.color_id);
    const checkedSizeIds = new Set(variant.sizes.map((s) => s.size_id));

    return (
        <div style={{ border: "1px solid #e5e7eb", padding: "20px", backgroundColor: "#fafafa" }}>
            {/* Row header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: selectedColor?.hex_code ?? "#e5e7eb", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                <select
                    value={variant.color_id}
                    onChange={(e) => onColorChange(e.target.value ? Number(e.target.value) : "")}
                    style={{ flex: 1, border: "1px solid #e5e7eb", padding: "8px 12px", fontSize: "12px", fontWeight: 700, backgroundColor: "#fff", outline: "none", cursor: "pointer" }}
                >
                    <option value="">Select color...</option>
                    {colors.map((c) => (
                        <option key={c.id} value={c.id} disabled={usedColorIds.includes(c.id)}>
                            {c.name}{usedColorIds.includes(c.id) ? " (already added)" : ""}
                        </option>
                    ))}
                </select>
                <button type="button" onClick={onRemove} style={{ padding: "8px 12px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>
                    Remove
                </button>
            </div>

            {/* Variant image + optional price — side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "12px", marginBottom: "16px" }}>
                <div>
                    <label style={{ ...S.label, fontSize: "8px" }}>Variant Image URL (optional — overrides main image)</label>
                    <input
                        style={{ ...S.input, fontSize: "12px" }}
                        value={variant.image_url}
                        onChange={(e) => onImageChange(e.target.value)}
                        placeholder="https://..."
                    />
                </div>
                <div>
                    <label style={{ ...S.label, fontSize: "8px" }}>Variant Price (optional)</label>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "rgba(45,50,62,0.4)", pointerEvents: "none" }}>$</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            style={{ ...S.input, fontSize: "12px", paddingLeft: "22px" }}
                            value={variant.variant_price}
                            onChange={(e) => onVariantPriceChange(e.target.value)}
                            placeholder="Leave blank to use base price"
                        />
                    </div>
                    <p style={{ fontSize: "8px", color: "rgba(45,50,62,0.4)", marginTop: "4px" }}>Leave blank to use product base price</p>
                </div>
            </div>

            {/* Size grid */}
            <div>
                <label style={{ ...S.label, fontSize: "8px", marginBottom: "10px" }}>
                    Sizes & Stock — click a size to select it, then set its stock quantity
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {sizes.map((size) => {
                        const isChecked = checkedSizeIds.has(size.id);
                        const entry = variant.sizes.find((s) => s.size_id === size.id);
                        return (
                            <div key={size.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0px" }}>
                                {/* Size toggle button */}
                                <button
                                    type="button"
                                    onClick={() => onToggleSize(size.id)}
                                    style={{
                                        padding: "7px 10px", fontSize: "10px", fontWeight: 900,
                                        border: `1px solid ${isChecked ? "#0A0A0A" : "#e5e7eb"}`,
                                        borderBottom: isChecked ? "none" : `1px solid #e5e7eb`,
                                        backgroundColor: isChecked ? "#0A0A0A" : "#fff",
                                        color: isChecked ? "#fff" : "rgba(45,50,62,0.4)",
                                        cursor: "pointer", transition: "all 0.1s",
                                        width: "58px", textAlign: "center",
                                    }}
                                >
                                    {size.size_value}
                                </button>
                                {/* Stock input — only shown when size is selected */}
                                {isChecked && entry && (
                                    <div style={{ width: "58px", border: "1px solid #0A0A0A", borderTop: "1px solid #333", backgroundColor: "#fff" }}>
                                        <p style={{ fontSize: "7px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.35)", textAlign: "center", paddingTop: "4px", marginBottom: "1px" }}>
                                            Stock
                                        </p>
                                        <input
                                            type="number"
                                            min="0"
                                            value={entry.stock_quantity}
                                            onChange={(e) => onUpdateStock(size.id, Math.max(0, parseInt(e.target.value) || 0))}
                                            style={{ width: "100%", border: "none", padding: "2px 6px 6px", fontSize: "13px", fontWeight: 900, textAlign: "center", outline: "none", backgroundColor: "transparent", boxSizing: "border-box" }}
                                        />
                                    </div>
                                )}
                                {/* Placeholder box so layout doesn't jump */}
                                {!isChecked && (
                                    <div style={{ width: "58px", height: "4px" }} />
                                )}
                            </div>
                        );
                    })}
                </div>
                {variant.sizes.length === 0 && variant.color_id && (
                    <p style={{ fontSize: "9px", color: "#dc2626", fontWeight: 700, marginTop: "10px" }}>Select at least one size</p>
                )}
            </div>
        </div>
    );
}
