import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Pagination from "@/Components/Pagination";
import AdminLayout from "@/Components/AdminLayout";

interface Product {
    id: number;
    name: string;
    brand: string;
    category: string;
    gender: string;
    base_price: string;
    main_image_url: string | null;
    is_active: boolean;
    variants_count: number;
}

interface Brand { id: number; name: string }

interface Props {
    products: { data: Product[]; current_page: number; last_page: number; from: number|null; to: number|null; total: number; links: any[] };
    brands: Brand[];
    filters: { search?: string; brand?: string; status?: string };
    stats: { total: number; active: number; inactive: number };
    admin: { name: string };
}

export default function AdminProductsIndex({ products, brands, filters, stats, admin }: Props) {
    const { flash }: any = usePage().props;
    const [search, setSearch] = useState(filters.search ?? "");
    const activeBrand  = filters.brand  ?? "";
    const activeStatus = filters.status ?? "active";

    const apply = (overrides: Record<string, string>) => {
        router.get(route("admin.products.index"), { search, brand: activeBrand, status: activeStatus, page: 1, ...overrides }, { preserveState: true, replace: true });
    };

    const isFiltered = !!(filters.search || activeBrand || (activeStatus && activeStatus !== "active"));

    const clearFilters = () => {
        setSearch("");
        router.get(route("admin.products.index"), {}, { preserveState: false, replace: true });
    };

    const handleToggle = (id: number) => {
        router.patch(route("admin.products.toggleActive", id), {}, { preserveScroll: true });
    };

    const handleDelete = (id: number, name: string) => {
        if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
        router.delete(route("admin.products.destroy", id));
    };

    const statusTabs = [
        { label: "Active",   value: "active",   count: stats.active },
        { label: "Inactive", value: "inactive", count: stats.inactive },
        { label: "All",      value: "all",       count: stats.total },
    ];

    return (
        <AdminLayout
            adminName={admin.name}
            active="products"
            pageTitle="Products"
            pageLabel="Catalog"
            headerRight={
                <Link
                    href={route("admin.products.create")}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", textDecoration: "none" }}
                >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Product
                </Link>
            }
        >
            <Head title="Admin — Products" />

            {/* Flash */}
            {flash?.success && (
                <div style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", padding: "14px 20px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#065f46", marginBottom: "20px" }}>
                    ✓ {flash.success}
                </div>
            )}

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
                {statusTabs.map((tab) => {
                    const isActive = activeStatus === tab.value;
                    return (
                        <button key={tab.value} onClick={() => apply({ status: tab.value })} style={{ padding: "20px", textAlign: "left", border: `1px solid ${isActive ? "#0A0A0A" : "#f0f0f0"}`, backgroundColor: isActive ? "#0A0A0A" : "#fff", color: isActive ? "#fff" : "#0A0A0A", cursor: "pointer", transition: "all 0.15s" }}>
                            <p style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}>{tab.count}</p>
                            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", opacity: isActive ? 0.6 : 0.4 }}>{tab.label}</p>
                        </button>
                    );
                })}
            </div>

            {/* Search + brand filter */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
                <form onSubmit={(e) => { e.preventDefault(); apply({ search }); }} style={{ flex: 1, display: "flex", gap: "12px" }}>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search product name..."
                        style={{ flex: 1, border: "1px solid #e5e7eb", backgroundColor: "#fff", padding: "12px 16px", fontSize: "12px", outline: "none" }}
                    />
                    <button type="submit" style={{ padding: "12px 24px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", border: "none", cursor: "pointer" }}>
                        Search
                    </button>
                </form>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <select
                        value={activeBrand}
                        onChange={(e) => apply({ brand: e.target.value })}
                        style={{ padding: "12px 16px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: "11px", fontWeight: 700, outline: "none", cursor: "pointer" }}
                    >
                        <option value="">All Brands</option>
                        {brands.map((b) => (
                            <option key={b.id} value={String(b.id)}>{b.name}</option>
                        ))}
                    </select>

                    {isFiltered && (
                        <button onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 16px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>
                            <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0" }}>
                {/* Header row — columns: thumb | name | brand | category | price | variants | actions */}
                <div style={{ display: "grid", gridTemplateColumns: "56px minmax(0,1.8fr) 110px 110px 80px 80px 160px", gap: "16px", padding: "12px 20px", borderBottom: "1px solid #f0f0f0" }}>
                    {["", "Product", "Brand", "Category", "Price", "Variants", "Actions"].map((h, i) => (
                        <p key={i} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.25)", textAlign: i === 6 ? "right" : "left" }}>{h}</p>
                    ))}
                </div>

                {products.data.length === 0 && (
                    <div style={{ padding: "80px 20px", textAlign: "center" }}>
                        <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.2)", marginBottom: "16px" }}>No products found</p>
                        <Link href={route("admin.products.create")} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#0A0A0A", textDecoration: "none", borderBottom: "1px solid #0A0A0A", paddingBottom: "1px" }}>
                            + Add your first product
                        </Link>
                    </div>
                )}

                {products.data.map((product) => (
                    <div key={product.id} style={{ display: "grid", gridTemplateColumns: "56px minmax(0,1.8fr) 110px 110px 80px 80px 160px", gap: "16px", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #fafafa" }}>

                        {/* Thumbnail */}
                        <div style={{ width: "48px", height: "48px", backgroundColor: "#f9fafb", overflow: "hidden", flexShrink: 0 }}>
                            {product.main_image_url
                                ? <img src={product.main_image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply", padding: "4px" }} />
                                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "#d1d5db", fontWeight: 700 }}>IMG</div>
                            }
                        </div>

                        {/* Name + gender + inactive badge */}
                        <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <p style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</p>
                                {!product.is_active && (
                                    <span style={{ flexShrink: 0, fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "1px 6px" }}>Inactive</span>
                                )}
                            </div>
                            <p style={{ fontSize: "10px", color: "rgba(45,50,62,0.4)", marginTop: "2px" }}>{product.gender}</p>
                        </div>

                        <p style={{ fontSize: "11px", fontWeight: 700 }}>{product.brand}</p>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(45,50,62,0.6)" }}>{product.category}</p>
                        <p style={{ fontSize: "12px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>${parseFloat(product.base_price).toFixed(2)}</p>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(45,50,62,0.5)" }}>{product.variants_count} SKUs</p>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                            <Link
                                href={route("admin.products.edit", product.id)}
                                style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#0A0A0A", textDecoration: "none", padding: "7px 14px", border: "1px solid #e5e7eb", whiteSpace: "nowrap" }}
                            >
                                Edit
                            </Link>
                            <button
                                onClick={() => handleToggle(product.id)}
                                style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", padding: "7px 12px", border: `1px solid ${product.is_active ? "#fde68a" : "#a7f3d0"}`, backgroundColor: product.is_active ? "#fffbeb" : "#ecfdf5", color: product.is_active ? "#b45309" : "#065f46", cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                                {product.is_active ? "Deactivate" : "Activate"}
                            </button>
                            {/* Trash icon delete button */}
                            <button
                                onClick={() => handleDelete(product.id, product.name)}
                                title={`Delete ${product.name}`}
                                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer", flexShrink: 0 }}
                            >
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination data={products} preserveFilters={{ search, brand: activeBrand, status: activeStatus }} />
        </AdminLayout>
    );
}
