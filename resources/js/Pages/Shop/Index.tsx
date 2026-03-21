import React, { useState, useRef } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import CartDrawer from "@/Components/CartDrawer";
import Pagination from "@/Components/Pagination";

interface Product {
    id: number;
    name: string;
    base_price: string;
    sale_price: string | null;
    effective_price: string;
    is_on_sale: boolean;
    main_image_url: string | null;
    brand: { id: number; name: string };
    category: { id: number; name: string };
    gender: { id: number; name: string };
    wishlisted: boolean;
}

interface FilterItem { id: number; name: string }

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: any[];
}

interface Props {
    products: PaginatedProducts;
    filters: { brand?: string; gender?: string; category?: string; search?: string; sort?: string };
}

const SORT_OPTIONS = [
    { value: "latest",     label: "Latest" },
    { value: "price_asc",  label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
];

export default function ShopIndex({ products, filters }: Props) {
    const { auth, cart, navigation }: any = usePage().props;
    const cartCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;

    // Get brands/categories/genders from shared navigation prop
    // instead of fetching them separately on every request
    const brands     = navigation?.brands     ?? [];
    const categories = navigation?.categories ?? [];
    const genders    = navigation?.genders    ?? [];

    const [search,      setSearch]      = useState(filters.search ?? "");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCartOpen,  setIsCartOpen]  = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    const activeBrand    = filters.brand    ?? "";
    const activeCategory = filters.category ?? "";
    const activeGender   = filters.gender   ?? "";
    const activeSort     = filters.sort     ?? "latest";

    const activeFilterCount = [activeBrand, activeCategory, activeGender].filter(Boolean).length;

    const apply = (overrides: Record<string, string>) => {
        router.get(route("shop.index"), {
            search,
            brand:    activeBrand,
            category: activeCategory,
            gender:   activeGender,
            sort:     activeSort,
            page:     "1",
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const clearAll = () => {
        setSearch("");
        router.get(route("shop.index"), {}, { preserveState: false, replace: true });
    };

    const isFiltered = !!(activeBrand || activeCategory || activeGender || filters.search);

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#fff", fontFamily: "inherit" }}>
            <Head title="Shop — SNEAKER.DRP" />

            {/* ── NAV ── */}
            <nav style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 32px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Link href={route("home")} style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", color: "#0A0A0A", textDecoration: "none" }}>
                        SNEAKER.DRP
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: "32px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                        <Link href={route("shop.index")} style={{ color: "#0A0A0A", textDecoration: "none", borderBottom: "2px solid #0A0A0A", paddingBottom: "2px" }}>Shop</Link>
                        <Link href={route("about")} style={{ color: "rgba(45,50,62,0.5)", textDecoration: "none" }}>About Us</Link>
                        {auth.user ? (
                            <>
                                <Link href={route("orders.index")} style={{ color: "rgba(45,50,62,0.5)", textDecoration: "none" }}>Orders</Link>
                                <Link href={route("wishlist.index")} style={{ color: "rgba(45,50,62,0.5)", textDecoration: "none" }}>Wishlist</Link>
                                <Link href="/logout" method="post" as="button" style={{ color: "rgba(45,50,62,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                                    Log Out
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" style={{ color: "rgba(45,50,62,0.5)", textDecoration: "none" }}>Login</Link>
                        )}
                        <button onClick={() => setIsCartOpen(true)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#0A0A0A" }}>
                            Vault
                            <span style={{ backgroundColor: "#0A0A0A", color: "#fff", padding: "2px 6px", borderRadius: "9999px", fontSize: "8px" }}>{cartCount}</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── PAGE HEADER ── */}
            <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "48px 32px 32px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.4em", color: "rgba(45,50,62,0.3)", marginBottom: "8px" }}>The Collection</p>
                        <h1 style={{ fontSize: "48px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: 1 }}>All Drops</h1>
                    </div>
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "rgba(45,50,62,0.4)", fontStyle: "italic" }}>
                        {products.from ?? 0}–{products.to ?? 0} of {products.total} products
                    </p>
                </div>
            </div>

            {/* ── SEARCH + SORT BAR ── */}
            <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 32px 24px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(45,50,62,0.3)", pointerEvents: "none" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") apply({ search }); }}
                            placeholder="Search sneakers..."
                            style={{ width: "100%", border: "1px solid #e5e7eb", padding: "12px 16px 12px 40px", fontSize: "12px", fontWeight: 600, outline: "none", backgroundColor: "#fff", boxSizing: "border-box" }}
                        />
                        {search && (
                            <button onClick={() => { setSearch(""); apply({ search: "" }); }} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(45,50,62,0.3)", padding: "4px" }}>
                                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        )}
                    </div>
                    <button onClick={() => apply({ search })} style={{ padding: "12px 24px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                        Search
                    </button>
                    <button
                        onClick={() => setSidebarOpen((v) => !v)}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", border: `1px solid ${sidebarOpen || activeFilterCount > 0 ? "#0A0A0A" : "#e5e7eb"}`, backgroundColor: sidebarOpen || activeFilterCount > 0 ? "#0A0A0A" : "#fff", color: sidebarOpen || activeFilterCount > 0 ? "#fff" : "#0A0A0A", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </button>
                    <select value={activeSort} onChange={(e) => apply({ sort: e.target.value })} style={{ padding: "12px 16px", border: "1px solid #e5e7eb", backgroundColor: "#fff", fontSize: "10px", fontWeight: 700, outline: "none", cursor: "pointer" }}>
                        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {isFiltered && (
                        <button onClick={clearAll} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 16px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer", whiteSpace: "nowrap" }}>
                            <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            Clear All
                        </button>
                    )}
                </div>

                {/* ── FILTER PANEL ── */}
                {sidebarOpen && (
                    <div style={{ marginTop: "12px", backgroundColor: "#fafafa", border: "1px solid #f0f0f0", padding: "24px 28px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px" }}>
                        <FilterGroup label="Brand"    items={brands}     active={activeBrand}    onSelect={(v) => apply({ brand: v })} />
                        <FilterGroup label="Category" items={categories} active={activeCategory} onSelect={(v) => apply({ category: v })} />
                        <FilterGroup label="Gender"   items={genders}    active={activeGender}   onSelect={(v) => apply({ gender: v })} />
                    </div>
                )}

                {/* Active filter chips */}
                {isFiltered && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                        {filters.search && <FilterChip label={`"${filters.search}"`} onRemove={() => { setSearch(""); apply({ search: "" }); }} />}
                        {activeBrand    && <FilterChip label={brands.find((b: FilterItem) => String(b.id) === activeBrand)?.name ?? "Brand"} onRemove={() => apply({ brand: "" })} />}
                        {activeCategory && <FilterChip label={categories.find((c: FilterItem) => String(c.id) === activeCategory)?.name ?? "Category"} onRemove={() => apply({ category: "" })} />}
                        {activeGender   && <FilterChip label={genders.find((g: FilterItem) => String(g.id) === activeGender)?.name ?? "Gender"} onRemove={() => apply({ gender: "" })} />}
                    </div>
                )}
            </div>

            {/* ── PRODUCT GRID ── */}
            <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 32px 80px" }}>
                {products.data.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 0", border: "1px solid #f5f5f7", backgroundColor: "#fafafa" }}>
                        <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.2)", marginBottom: "16px" }}>No sneakers found</p>
                        <button onClick={clearAll} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#0A0A0A", background: "none", border: "none", borderBottom: "1px solid #0A0A0A", paddingBottom: "1px", cursor: "pointer" }}>
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", backgroundColor: "#f0f0f0", border: "1px solid #f0f0f0", overflow: "hidden" }}>
                            {products.data.map((product) => (
                                <ProductCard key={product.id} product={product} auth={auth} />
                            ))}
                        </div>

                        {/* Pagination */}
                        <Pagination
                            data={products}
                            preserveFilters={{ search, brand: activeBrand, category: activeCategory, gender: activeGender, sort: activeSort }}
                        />
                    </>
                )}
            </div>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
}

// ── Filter Group ──────────────────────────────────────────────────────────────
function FilterGroup({ label, items, active, onSelect }: { label: string; items: FilterItem[]; active: string; onSelect: (v: string) => void }) {
    return (
        <div>
            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.35)", marginBottom: "14px" }}>{label}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button onClick={() => onSelect("")} style={{ textAlign: "left", padding: "7px 12px", fontSize: "11px", fontWeight: active === "" ? 900 : 600, border: "none", backgroundColor: active === "" ? "#0A0A0A" : "transparent", color: active === "" ? "#fff" : "rgba(45,50,62,0.6)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    All
                </button>
                {items.map((item: FilterItem) => {
                    const isActive = String(item.id) === active;
                    return (
                        <button key={item.id} onClick={() => onSelect(isActive ? "" : String(item.id))} style={{ textAlign: "left", padding: "7px 12px", fontSize: "11px", fontWeight: isActive ? 900 : 600, border: "none", backgroundColor: isActive ? "#0A0A0A" : "transparent", color: isActive ? "#fff" : "rgba(45,50,62,0.6)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {item.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── Filter Chip ───────────────────────────────────────────────────────────────
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px 4px 12px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {label}
            <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", padding: "0", display: "flex", alignItems: "center" }}>
                <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>
    );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, auth }: { product: Product; auth: any }) {
    const [hovered,    setHovered]    = useState(false);
    const [wishlisted, setWishlisted] = useState(product.wishlisted);
    const [wishFlash,  setWishFlash]  = useState(false);

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!auth?.user) { window.location.href = '/login'; return; }
        router.post(route('wishlist.toggle'), { product_id: product.id }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setWishlisted(v => !v);
                setWishFlash(true);
                setTimeout(() => setWishFlash(false), 1200);
            },
        });
    };

    return (
        <Link
            href={route("shop.show", product.id)}
            style={{ display: "block", backgroundColor: "#fff", padding: "28px", textDecoration: "none", color: "inherit", transition: "background-color 0.3s", position: "relative" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {product.is_on_sale && (
                <div style={{ position: "absolute", top: "16px", left: "16px", zIndex: 10, backgroundColor: "#0A0A0A", color: "#fff", fontSize: "7px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.15em", padding: "3px 8px" }}>
                    Sale
                </div>
            )}
            <button onClick={handleWishlist} title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"} style={{ position: "absolute", top: "16px", right: "16px", zIndex: 10, background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", transition: "transform 0.2s", transform: wishFlash ? "scale(1.3)" : "scale(1)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? "#0A0A0A" : "none"} stroke="#0A0A0A" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            </button>
            <div style={{ aspectRatio: "1/1", backgroundColor: "#F5F5F7", overflow: "hidden", marginBottom: "20px" }}>
                <img src={product.main_image_url ?? "https://via.placeholder.com/600"} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", transform: hovered ? "scale(1.07)" : "scale(1)", transition: "transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)", mixBlendMode: "multiply" }} />
            </div>
            <div>
                <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(45,50,62,0.35)", marginBottom: "6px" }}>{product.brand.name}</p>
                <h3 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: "16px" }}>{product.name}</h3>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <p style={{ fontSize: "15px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>${parseFloat(product.effective_price).toFixed(2)}</p>
                        {product.is_on_sale && (
                            <p style={{ fontSize: "12px", fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "rgba(45,50,62,0.35)", textDecoration: "line-through" }}>${parseFloat(product.base_price).toFixed(2)}</p>
                        )}
                    </div>
                    <span style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `2px solid ${hovered ? "#0A0A0A" : "transparent"}`, paddingBottom: "2px", transition: "border-color 0.2s", color: "#0A0A0A" }}>View →</span>
                </div>
            </div>
        </Link>
    );
}
