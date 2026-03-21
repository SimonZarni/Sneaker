import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";

interface LookupItem { id: number; name: string }
interface ColorItem  { id: number; name: string; hex_code: string | null }
interface SizeItem   { id: number; size_value: string }
interface SizeEntry  { size_id: number; stock_quantity: number; variant_id?: number }
interface VariantRow { _key: string; color_id: number | ""; image_url: string; variant_price: string; sizes: SizeEntry[] }

interface ExistingProduct {
    id: number;
    name: string;
    brand_id: number;
    category_id: number;
    gender_id: number;
    base_price: string;
    description: string | null;
    main_image_url: string | null;
    is_active: boolean;
    sale_price: string;
    sale_ends_at: string | null;
    variants: { color_id: number; image_url: string | null; variant_price: string | null; sizes: SizeEntry[] }[];
}

interface Props {
    product: ExistingProduct;
    brands: LookupItem[];
    categories: LookupItem[];
    genders: LookupItem[];
    colors: ColorItem[];
    sizes: SizeItem[];
    admin: { name: string };
}

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

export default function AdminProductsEdit({ product, brands, categories, genders, colors, sizes, admin }: Props) {
    const [name,          setName]         = useState(product.name);
    const [brandId,       setBrandId]      = useState(String(product.brand_id));
    const [categoryId,    setCategoryId]   = useState(String(product.category_id));
    const [genderId,      setGenderId]     = useState(String(product.gender_id));
    const [basePrice,     setBasePrice]    = useState(String(product.base_price));
    const [description,   setDescription] = useState(product.description ?? "");
    const [mainImageUrl,  setMainImageUrl] = useState(product.main_image_url ?? "");
    const [isActive,      setIsActive]     = useState(product.is_active);
    const [salePrice,     setSalePrice]    = useState(product.sale_price ?? '');
    const [saleEndsAt,    setSaleEndsAt]   = useState(product.sale_ends_at ?? '');
    const [discountPct,   setDiscountPct]  = useState('');
    const [processing,    setProcessing]   = useState(false);
    const [errors,        setErrors]       = useState<Record<string, string>>({});

    // Seed variants from existing product data
    const [variants, setVariants] = useState<VariantRow[]>(
        product.variants.map((v) => ({
            _key:          Math.random().toString(36).slice(2),
            color_id:      v.color_id,
            image_url:     v.image_url ?? "",
            variant_price: v.variant_price != null ? String(v.variant_price) : "",
            sizes:         v.sizes,
        }))
    );

    const addVariant = () => setVariants((v) => [...v, newVariantRow()]);
    const removeVariant = (key: string) => setVariants((v) => v.filter((r) => r._key !== key));

    const updateVariant = (key: string, field: "color_id" | "image_url" | "variant_price", value: any) =>
        setVariants((v) => v.map((r) => r._key === key ? { ...r, [field]: value } : r));

    const toggleSize = (key: string, sizeId: number) => {
        setVariants((v) => v.map((r) => {
            if (r._key !== key) return r;
            const exists = r.sizes.find((s) => s.size_id === sizeId);
            const newSizes = exists
                ? r.sizes.filter((s) => s.size_id !== sizeId)
                : [...r.sizes, { size_id: sizeId, stock_quantity: 1 }];
            return { ...r, sizes: newSizes };
        }));
    };

    const updateStock = (key: string, sizeId: number, qty: number) =>
        setVariants((v) => v.map((r) => {
            if (r._key !== key) return r;
            return { ...r, sizes: r.sizes.map((s) => s.size_id === sizeId ? { ...s, stock_quantity: qty } : s) };
        }));

    const usedColorIds = variants.map((v) => v.color_id).filter(Boolean) as number[];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.patch(
            route("admin.products.update", product.id),
            {
                name, brand_id: brandId, category_id: categoryId, gender_id: genderId,
                base_price: basePrice, description, main_image_url: mainImageUrl,
                is_active: isActive,
                sale_price: salePrice || null,
                sale_ends_at: saleEndsAt || null,
                variants: variants.map(({ _key, ...rest }) => rest),
            } as any,
            {
                onError: (e) => { setErrors(e); setProcessing(false); },
                onSuccess: () => setProcessing(false),
            }
        );
    };

    return (
        <AdminLayout
            adminName={admin.name}
            active="products"
            pageTitle="Edit Product"
            pageLabel="Catalog"
            headerRight={
                <Link href={route("admin.products.index")} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)", textDecoration: "none" }}>
                    ← Back to Products
                </Link>
            }
        >
            <Head title={`Admin — Edit ${product.name}`} />

            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>

                    {/* ── LEFT ── */}
                    <div>
                        <div style={S.card}>
                            <p style={S.sectionTitle}>Product Info</p>
                            <div style={{ display: "grid", gap: "18px" }}>

                                <div>
                                    <label style={S.label}>Product Name *</label>
                                    <input style={S.input} value={name} onChange={(e) => setName(e.target.value)} />
                                    {errors.name && <p style={S.error}>{errors.name}</p>}
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                                    <div>
                                        <label style={S.label}>Brand *</label>
                                        <select style={S.select} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                                            <option value="">Select brand</option>
                                            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={S.label}>Category *</label>
                                        <select style={S.select} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                                            <option value="">Select category</option>
                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={S.label}>Gender *</label>
                                        <select style={S.select} value={genderId} onChange={(e) => setGenderId(e.target.value)}>
                                            <option value="">Select gender</option>
                                            {genders.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={S.label}>Description</label>
                                    <textarea style={{ ...S.input, minHeight: "90px", resize: "vertical", fontFamily: "inherit" }} value={description} onChange={(e) => setDescription(e.target.value)} />
                                </div>

                                <div>
                                    <label style={S.label}>Main Image URL</label>
                                    <input style={S.input} value={mainImageUrl} onChange={(e) => setMainImageUrl(e.target.value)} placeholder="https://..." />
                                    {mainImageUrl && (
                                        <div style={{ marginTop: "10px", width: "80px", height: "80px", backgroundColor: "#f9fafb", border: "1px solid #f0f0f0" }}>
                                            <img src={mainImageUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply", padding: "4px" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Variants */}
                        <div style={S.card}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #f5f5f5" }}>
                                <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em" }}>Colorways & Stock</p>
                                <button type="button" onClick={addVariant} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", backgroundColor: "#5B8C5A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer" }}>
                                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    Add Color
                                </button>
                            </div>

                            {variants.length === 0 && (
                                <div style={{ padding: "32px", textAlign: "center", border: "1px dashed #e5e7eb", backgroundColor: "#fafafa" }}>
                                    <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.3)" }}>No colorways</p>
                                </div>
                            )}

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {variants.map((variant, idx) => {
                                    const selectedColor = colors.find((c) => c.id === variant.color_id);
                                    const checkedSizeIds = new Set(variant.sizes.map((s) => s.size_id));
                                    const restricted = usedColorIds.filter((id) => id !== variant.color_id);

                                    return (
                                        <div key={variant._key} style={{ border: "1px solid #e5e7eb", padding: "20px", backgroundColor: "#fafafa" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                                <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: selectedColor?.hex_code ?? "#e5e7eb", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                                                <select
                                                    value={variant.color_id}
                                                    onChange={(e) => updateVariant(variant._key, "color_id", e.target.value ? Number(e.target.value) : "")}
                                                    style={{ flex: 1, border: "1px solid #e5e7eb", padding: "8px 12px", fontSize: "12px", fontWeight: 700, backgroundColor: "#fff", outline: "none", cursor: "pointer" }}
                                                >
                                                    <option value="">Select color...</option>
                                                    {colors.map((c) => (
                                                        <option key={c.id} value={c.id} disabled={restricted.includes(c.id)}>
                                                            {c.name}{restricted.includes(c.id) ? " (already added)" : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button type="button" onClick={() => removeVariant(variant._key)} style={{ padding: "8px 12px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>
                                                    Remove
                                                </button>
                                            </div>

                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "12px", marginBottom: "16px" }}>
                                                <div>
                                                    <label style={{ ...S.label, fontSize: "8px" }}>Variant Image URL (optional)</label>
                                                    <input style={{ ...S.input, fontSize: "12px" }} value={variant.image_url} onChange={(e) => updateVariant(variant._key, "image_url", e.target.value)} placeholder="https://..." />
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
                                                            onChange={(e) => updateVariant(variant._key, "variant_price", e.target.value)}
                                                            placeholder="Base price"
                                                        />
                                                    </div>
                                                    <p style={{ fontSize: "8px", color: "rgba(45,50,62,0.4)", marginTop: "4px" }}>Leave blank to use product base price</p>
                                                </div>
                                            </div>

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
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleSize(variant._key, size.id)}
                                                                    style={{ padding: "7px 10px", fontSize: "10px", fontWeight: 900, border: `1px solid ${isChecked ? "#5B8C5A" : "#e5e7eb"}`, borderBottom: isChecked ? "none" : `1px solid #e5e7eb`, backgroundColor: isChecked ? "#5B8C5A" : "#fff", color: isChecked ? "#fff" : "rgba(45,50,62,0.4)", cursor: "pointer", transition: "all 0.1s", width: "58px", textAlign: "center" }}
                                                                >
                                                                    {size.size_value}
                                                                </button>
                                                                {isChecked && entry && (
                                                                    <div style={{ width: "58px", border: "1px solid #5B8C5A", borderTop: "1px solid #333", backgroundColor: "#fff" }}>
                                                                        <p style={{ fontSize: "7px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.35)", textAlign: "center", paddingTop: "4px", marginBottom: "1px" }}>
                                                                            Stock
                                                                        </p>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={entry.stock_quantity}
                                                                            onChange={(e) => updateStock(variant._key, size.id, Math.max(0, parseInt(e.target.value) || 0))}
                                                                            style={{ width: "100%", border: "none", padding: "2px 6px 6px", fontSize: "13px", fontWeight: 900, textAlign: "center", outline: "none", backgroundColor: "transparent", boxSizing: "border-box" as const }}
                                                                        />
                                                                    </div>
                                                                )}
                                                                {!isChecked && (
                                                                    <div style={{ width: "58px", height: "4px" }} />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT ── */}
                    <div style={{ position: "sticky", top: "100px" }}>
                        <div style={S.card}>
                            <p style={S.sectionTitle}>Pricing & Status</p>
                            <div style={{ display: "grid", gap: "18px" }}>
                                <div>
                                    <label style={S.label}>Base Price (USD) *</label>
                                    <div style={{ position: "relative" }}>
                                        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontWeight: 700, color: "rgba(45,50,62,0.4)" }}>$</span>
                                        <input type="number" step="0.01" min="0" style={{ ...S.input, paddingLeft: "28px" }} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
                                    </div>
                                    {errors.base_price && <p style={S.error}>{errors.base_price}</p>}
                                </div>

                                {/* ── SALE PRICING ── */}
                                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "18px" }}>
                                    <p style={{ ...S.sectionTitle, marginBottom: "14px", paddingBottom: "8px", fontSize: "9px" }}>Sale Pricing (Optional)</p>

                                    {/* Discount % helper */}
                                    <div style={{ marginBottom: "14px" }}>
                                        <label style={S.label}>Quick Discount %</label>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <div style={{ position: "relative", flex: 1 }}>
                                                <input
                                                    type="number" min="0" max="99" step="1" placeholder="e.g. 20"
                                                    style={{ ...S.input, paddingRight: "28px" }}
                                                    value={discountPct}
                                                    onChange={(e) => {
                                                        const pct = parseFloat(e.target.value);
                                                        setDiscountPct(e.target.value);
                                                        if (!isNaN(pct) && pct > 0 && pct < 100 && basePrice) {
                                                            const base = parseFloat(basePrice);
                                                            if (!isNaN(base)) {
                                                                setSalePrice((base * (1 - pct / 100)).toFixed(2));
                                                            }
                                                        }
                                                    }}
                                                />
                                                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "rgba(45,50,62,0.4)", fontWeight: 700 }}>%</span>
                                            </div>
                                            <button type="button" onClick={() => { setSalePrice(''); setDiscountPct(''); }}
                                                style={{ padding: "11px 14px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", border: "1px solid #e5e7eb", backgroundColor: "#fff", color: "rgba(45,50,62,0.4)", cursor: "pointer", whiteSpace: "nowrap" as const }}>
                                                Clear
                                            </button>
                                        </div>
                                        <p style={{ fontSize: "9px", color: "rgba(45,50,62,0.35)", marginTop: "4px" }}>
                                            Typing a % auto-fills the sale price below. You can still adjust it manually.
                                        </p>
                                    </div>

                                    {/* Sale price */}
                                    <div style={{ marginBottom: "14px" }}>
                                        <label style={S.label}>Sale Price (USD)</label>
                                        <div style={{ position: "relative" }}>
                                            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontWeight: 700, color: "rgba(45,50,62,0.4)" }}>$</span>
                                            <input type="number" step="0.01" min="0" placeholder="Leave empty for no sale"
                                                style={{ ...S.input, paddingLeft: "28px" }}
                                                value={salePrice}
                                                onChange={(e) => { setSalePrice(e.target.value); setDiscountPct(''); }}
                                            />
                                        </div>
                                        {salePrice && basePrice && parseFloat(salePrice) >= parseFloat(basePrice) && (
                                            <p style={{ fontSize: "9px", color: "#dc2626", fontWeight: 700, marginTop: "4px" }}>
                                                Sale price should be less than the base price (${parseFloat(basePrice).toFixed(2)})
                                            </p>
                                        )}
                                        {salePrice && basePrice && parseFloat(salePrice) < parseFloat(basePrice) && (
                                            <p style={{ fontSize: "9px", color: "#5B8C5A", fontWeight: 700, marginTop: "4px" }}>
                                                Saving ${(parseFloat(basePrice) - parseFloat(salePrice)).toFixed(2)} ({Math.round((1 - parseFloat(salePrice)/parseFloat(basePrice))*100)}% off)
                                            </p>
                                        )}
                                        {errors.sale_price && <p style={S.error}>{errors.sale_price}</p>}
                                    </div>

                                    {/* Sale ends at */}
                                    <div>
                                        <label style={S.label}>Sale Ends At (optional)</label>
                                        <input type="datetime-local"
                                            style={S.input}
                                            value={saleEndsAt}
                                            onChange={(e) => setSaleEndsAt(e.target.value)}
                                        />
                                        <p style={{ fontSize: "9px", color: "rgba(45,50,62,0.35)", marginTop: "4px" }}>
                                            Leave empty for no expiry — sale stays until you remove the price.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label style={S.label}>Status</label>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        {[{ label: "Active", value: true }, { label: "Inactive", value: false }].map((opt) => (
                                            <button key={String(opt.value)} type="button" onClick={() => setIsActive(opt.value)} style={{ flex: 1, padding: "10px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: `1px solid ${isActive === opt.value ? "#5B8C5A" : "#e5e7eb"}`, backgroundColor: isActive === opt.value ? "#5B8C5A" : "#fff", color: isActive === opt.value ? "#fff" : "rgba(45,50,62,0.5)", cursor: "pointer" }}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

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

                        <button type="submit" disabled={processing} style={{ width: "100%", padding: "16px", backgroundColor: "#5B8C5A", color: "#fff", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", border: "none", cursor: processing ? "not-allowed" : "pointer", opacity: processing ? 0.5 : 1, marginBottom: "10px" }}>
                            {processing ? "Saving..." : "Save Changes"}
                        </button>

                        <Link
                            href={route("admin.products.index")}
                            style={{ display: "block", width: "100%", padding: "14px", border: "1px solid #e5e7eb", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", textAlign: "center", textDecoration: "none", color: "rgba(45,50,62,0.5)", boxSizing: "border-box" }}
                        >
                            Cancel
                        </Link>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
