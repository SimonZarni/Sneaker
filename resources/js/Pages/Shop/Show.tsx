import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import CartDrawer from "@/Components/CartDrawer";

interface Variant {
    id: number;
    size: { id: number; size_value: string };
    color: { id: number; name: string; hex_code: string };
    stock_quantity: number;
    image_url: string | null;
}

interface Product {
    id: number;
    name: string;
    description: string;
    base_price: string;
    main_image_url: string;
    brand: { name: string };
    category: { name: string };
    variants: Variant[];
}

interface RelatedProduct {
    id: number;
    name: string;
    base_price: string;
    main_image_url: string | null;
    brand: string;
}

interface Review {
    id: number;
    rating: number;
    title: string | null;
    body: string | null;
    user_name: string;
    created_at: string;
}

interface UserReview {
    id: number;
    rating: number;
    title: string | null;
    body: string | null;
    is_approved: boolean;
}

interface RatingBreakdown {
    star: number;
    count: number;
}

interface Props {
    product: Product;
    wishlisted: boolean;
    related: RelatedProduct[];
    reviews: Review[];
    avgRating: number | null;
    reviewCount: number;
    ratingBreakdown: RatingBreakdown[];
    userReview: UserReview | null;
    hasPurchased: boolean;
}

export default function Show({ product, wishlisted: initialWishlisted, related, reviews, avgRating, reviewCount, ratingBreakdown, userReview: initialUserReview, hasPurchased }: Props) {
    const { cart, auth }: any = usePage().props;

    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [selectedSize,  setSelectedSize]  = useState<number | null>(null);
    const [isCartOpen,    setIsCartOpen]    = useState(false);
    const [addedFlash,    setAddedFlash]    = useState(false);
    const [wishlisted,    setWishlisted]    = useState(initialWishlisted);
    const [wishFlash,     setWishFlash]     = useState(false);

    // ── Review form state ─────────────────────────────────────────────────────
    const [showReviewForm,  setShowReviewForm]  = useState(false);
    const [reviewRating,    setReviewRating]    = useState(initialUserReview?.rating ?? 0);
    const [reviewTitle,     setReviewTitle]     = useState(initialUserReview?.title ?? "");
    const [reviewBody,      setReviewBody]      = useState(initialUserReview?.body ?? "");
    const [reviewSubmitting,setReviewSubmitting]= useState(false);
    const [userReview,      setUserReview]      = useState(initialUserReview);

    // ── Derived data ──────────────────────────────────────────────────────────

    // All unique colors across all variants
    const uniqueColors = product.variants
        .map(v => v.color)
        .filter((c, i, self) => c && self.findIndex(t => t.id === c.id) === i);

    // Sizes available FOR the selected color (with stock info)
    const sizesForColor: Array<{ id: number; size_value: string; stock: number }> =
        selectedColor === null
            ? [] // don't show sizes until a color is chosen
            : product.variants
                .filter(v => v.color?.id === selectedColor)
                .map(v => ({ id: v.size.id, size_value: v.size.size_value, stock: v.stock_quantity }))
                .sort((a, b) => parseFloat(a.size_value) - parseFloat(b.size_value));

    // All unique sizes (for the "size guide" reference when no color selected)
    const allUniqueSizes = product.variants
        .map(v => v.size)
        .filter((s, i, self) => s && self.findIndex(t => t.id === s.id) === i)
        .sort((a, b) => parseFloat(a.size_value) - parseFloat(b.size_value));

    // The exact variant matching both selections
    const selectedVariant = selectedColor !== null && selectedSize !== null
        ? product.variants.find(v => v.color?.id === selectedColor && v.size?.id === selectedSize)
        : undefined;

    const currentColor    = uniqueColors.find(c => c.id === selectedColor);
    const selectedSizeObj = sizesForColor.find(s => s.id === selectedSize);

    const isOutOfStock = selectedVariant !== undefined && selectedVariant.stock_quantity === 0;
    const lowStock     = selectedVariant && selectedVariant.stock_quantity > 0 && selectedVariant.stock_quantity < 5;

    // Does the selected color have ANY stock at all?
    const colorHasNoStock = selectedColor !== null &&
        sizesForColor.every(s => s.stock === 0);

    // Cart count for nav badge
    const cartCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;

    // As soon as a color is selected, find the first variant for that color that
    // has an image_url and use it. Falls back to product.main_image_url if none.
    const colorImage = selectedColor !== null
        ? product.variants.find(v => v.color?.id === selectedColor && v.image_url)?.image_url ?? null
        : null;
    const activeImage = colorImage || product.main_image_url;

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleWishlist = () => {
        if (!auth?.user) {
            window.location.href = '/login';
            return;
        }
        router.post(route('wishlist.toggle'), { product_id: product.id }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setWishlisted(v => !v);
                setWishFlash(true);
                setTimeout(() => setWishFlash(false), 1500);
            },
        });
    };

    const handleSubmitReview = () => {
        if (reviewRating === 0) return;
        setReviewSubmitting(true);
        router.post(route('reviews.store'), {
            product_id: product.id,
            rating:     reviewRating,
            title:      reviewTitle,
            body:       reviewBody,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowReviewForm(false);
                setReviewSubmitting(false);
            },
            onError: () => setReviewSubmitting(false),
        });
    };

    const handleDeleteReview = (id: number) => {
        router.delete(route('reviews.destroy', id), { preserveScroll: true });
    };

    const handleColorSelect = (colorId: number) => {
        setSelectedColor(colorId);
        setSelectedSize(null); // reset size when color changes
    };

    const handleAddToVault = () => {
        if (!selectedVariant || isOutOfStock) return;

        router.post(
            "/cart",
            { product_variant_id: selectedVariant.id, quantity: 1 },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setAddedFlash(true);
                    setTimeout(() => setAddedFlash(false), 1800);
                    setIsCartOpen(true);
                },
            }
        );
    };

    // ── Size tile status ──────────────────────────────────────────────────────
    const getSizeState = (size: { id: number; stock: number }) => {
        if (size.stock === 0) return "soldout";
        if (size.id === selectedSize) return "selected";
        return "available";
    };

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title={`${product.brand.name} ${product.name} — SNEAKER.DRP`} />

            {/* ── NAV ── */}
            <nav className="border-b border-brand-surface py-5 sticky top-0 bg-brand-white/90 backdrop-blur-md z-50">
                <div className="mx-auto max-w-7xl px-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <Link href="/shop" className="hover:text-brand-slate transition-colors">
                        ← Collection
                    </Link>
                    <Link href="/" className="text-xl tracking-tightest">SNEAKER.DRP</Link>
                    <button onClick={() => setIsCartOpen(true)} className="hover:text-brand-slate uppercase flex items-center gap-2">
                        Vault
                        <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px]">
                            {cartCount}
                        </span>
                    </button>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-4 py-12 lg:flex lg:gap-x-16">

                {/* ── LEFT: Gallery ── */}
                <div className="lg:w-[60%]">
                    {/* Main image — swaps when variant image available */}
                    <div className="aspect-[4/5] bg-brand-surface overflow-hidden border border-brand-surface">
                        <img
                            key={activeImage} // re-mount triggers fade
                            src={activeImage || "https://via.placeholder.com/1000"}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                            alt={product.name}
                        />
                    </div>
                </div>

                {/* ── RIGHT: Sidebar ── */}
                <div className="lg:w-[40%] mt-12 lg:mt-0 lg:sticky lg:top-28 lg:h-fit space-y-0">

                    {/* Header */}
                    <div className="border-b border-brand-surface pb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-slate/40">
                                {product.brand.name}
                            </span>
                            <span className="w-1 h-1 bg-brand-slate/20 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-slate/40">
                                {product.category.name}
                            </span>
                        </div>
                        <h2 className="text-5xl font-black uppercase tracking-tightest leading-[0.85] mb-6">
                            {product.name}
                        </h2>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-2xl font-medium tracking-tighter">${product.base_price}</p>
                            <button
                                onClick={handleWishlist}
                                title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                                className="flex items-center gap-2 group"
                            >
                                <svg
                                    width="22" height="22" viewBox="0 0 24 24"
                                    fill={wishlisted ? "#0A0A0A" : "none"}
                                    stroke="#0A0A0A" strokeWidth="1.5"
                                    className={`transition-transform duration-200 ${wishFlash ? "scale-125" : "scale-100"}`}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                                <span className="text-[9px] font-black uppercase tracking-widest text-brand-slate/40 group-hover:text-brand-charcoal transition-colors">
                                    {wishlisted ? "Saved" : "Save"}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* ── COLOR SELECTION ── */}
                    <div className="py-8 border-b border-brand-surface">
                        <div className="flex justify-between items-end mb-5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-slate/50">
                                Colorway
                            </span>
                            <span className="text-[10px] font-bold uppercase text-brand-charcoal">
                                {currentColor?.name ?? "Select a color"}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {uniqueColors.map(color => {
                                const colorVariants = product.variants.filter(v => v.color?.id === color.id);
                                const totalStock = colorVariants.reduce((sum, v) => sum + v.stock_quantity, 0);
                                const fullyOut   = totalStock === 0;

                                return (
                                    <button
                                        key={color.id}
                                        onClick={() => !fullyOut && handleColorSelect(color.id)}
                                        disabled={fullyOut}
                                        title={fullyOut ? `${color.name} — Sold Out` : color.name}
                                        className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                                            selectedColor === color.id
                                                ? "border-brand-charcoal scale-110 ring-4 ring-brand-surface"
                                                : fullyOut
                                                ? "border-brand-surface cursor-not-allowed opacity-30"
                                                : "border-brand-surface hover:border-brand-charcoal hover:scale-105"
                                        }`}
                                        style={{ backgroundColor: color.hex_code }}
                                    >
                                        {/* Diagonal strike for fully sold-out */}
                                        {fullyOut && (
                                            <span
                                                className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                                                style={{
                                                    background: "linear-gradient(to bottom-right, transparent 45%, rgba(150,150,150,0.6) 45%, rgba(150,150,150,0.6) 55%, transparent 55%)",
                                                }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {colorHasNoStock && (
                            <p className="mt-3 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                                All sizes sold out in this colorway
                            </p>
                        )}
                    </div>

                    {/* ── SIZE SELECTION ── */}
                    <div className="py-8 border-b border-brand-surface">
                        <div className="flex justify-between items-center mb-5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-slate/50">
                                Size (US)
                            </span>
                            <button className="text-[10px] font-bold uppercase border-b border-brand-charcoal hover:text-brand-slate transition-colors">
                                Size Guide
                            </button>
                        </div>

                        {selectedColor === null ? (
                            /* No color selected yet — show all sizes greyed out as placeholder */
                            <div>
                                <div className="grid grid-cols-4 gap-px bg-brand-surface border border-brand-surface overflow-hidden mb-3">
                                    {allUniqueSizes.map(size => (
                                        <div
                                            key={size.id}
                                            className="py-5 text-xs font-bold uppercase text-center text-brand-slate/20 bg-brand-white cursor-default select-none"
                                        >
                                            {size.size_value}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-slate/30">
                                    ↑ Select a colorway first
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-px bg-brand-surface border border-brand-surface overflow-hidden">
                                {sizesForColor.map(size => {
                                    const state = getSizeState(size);
                                    return (
                                        <button
                                            key={size.id}
                                            onClick={() => state !== "soldout" && setSelectedSize(size.id)}
                                            disabled={state === "soldout"}
                                            className={`py-5 text-xs font-bold uppercase transition-all duration-150 relative ${
                                                state === "selected"
                                                    ? "bg-brand-charcoal text-brand-white"
                                                    : state === "soldout"
                                                    ? "bg-brand-white text-brand-slate/20 cursor-not-allowed"
                                                    : "bg-brand-white text-brand-charcoal hover:bg-brand-surface"
                                            }`}
                                        >
                                            {size.size_value}
                                            {/* Strike-through overlay for sold-out */}
                                            {state === "soldout" && (
                                                <span
                                                    className="absolute inset-0 pointer-events-none"
                                                    style={{
                                                        background: "linear-gradient(to bottom-right, transparent 45%, rgba(180,180,180,0.4) 45%, rgba(180,180,180,0.4) 55%, transparent 55%)",
                                                    }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── AVAILABILITY INDICATOR ── */}
                    {selectedVariant !== undefined && (
                        <div className="pt-6 flex justify-between items-center animate-in fade-in duration-300">
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-slate/40">
                                Availability
                            </span>
                            <span className={`text-[9px] font-bold uppercase px-2.5 py-1 ${
                                isOutOfStock
                                    ? "bg-red-50 text-red-600"
                                    : lowStock
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-brand-surface text-brand-charcoal"
                            }`}>
                                {isOutOfStock
                                    ? "Sold Out"
                                    : lowStock
                                    ? `Only ${selectedVariant.stock_quantity} left`
                                    : `${selectedVariant.stock_quantity} in Vault`}
                            </span>
                        </div>
                    )}

                    {/* ── ADD TO VAULT ── */}
                    <div className="pt-6">
                        <button
                            onClick={handleAddToVault}
                            disabled={!selectedVariant || isOutOfStock}
                            className={`w-full py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-200 relative overflow-hidden ${
                                addedFlash
                                    ? "bg-emerald-600 text-white"
                                    : !selectedVariant || isOutOfStock
                                    ? "bg-brand-surface text-brand-slate/30 cursor-not-allowed"
                                    : "bg-brand-charcoal text-brand-white hover:bg-brand-slate"
                            }`}
                        >
                            {addedFlash
                                ? "✓ Added to Vault"
                                : isOutOfStock
                                ? "Sold Out"
                                : !selectedColor
                                ? "Select a Colorway"
                                : !selectedSize
                                ? "Select a Size"
                                : "Add to Vault"}
                        </button>
                    </div>

                    {/* ── THE STORY ── */}
                    {product.description && (
                        <div className="pt-10 border-t border-brand-surface mt-8">
                            <h4 className="text-[9px] font-black uppercase tracking-widest mb-4 text-brand-slate/50">
                                The Story
                            </h4>
                            <p className="text-xs leading-loose text-brand-slate font-medium">
                                {product.description}
                            </p>
                        </div>
                    )}

                    {/* ── DETAILS ACCORDION ── */}
                    <div className="pt-8 space-y-px border-t border-brand-surface mt-6">
                        {[
                            { label: "Free Shipping & Returns", body: "Complimentary shipping on all orders. Easy 30-day returns on unworn pairs." },
                            { label: "Authenticity Guaranteed", body: "Every pair in the vault is verified authentic before it ships to you." },
                        ].map(item => (
                            <AccordionRow key={item.label} label={item.label} body={item.body} />
                        ))}
                    </div>
                </div>
            </main>

            {/* ── REVIEWS SECTION ── */}
            <section className="border-t border-brand-surface py-20 px-4">
                <div className="mx-auto max-w-7xl">

                    {/* Section header */}
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/30 mb-2">
                                Customer Feedback
                            </p>
                            <h3 className="text-3xl font-black uppercase tracking-tightest">
                                Reviews
                                {reviewCount > 0 && (
                                    <span className="ml-4 text-lg font-medium text-brand-slate/40 normal-case tracking-normal">
                                        {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                                    </span>
                                )}
                            </h3>
                        </div>
                        {hasPurchased && !userReview && (
                            <button
                                onClick={() => setShowReviewForm(v => !v)}
                                className="text-[9px] font-black uppercase tracking-widest border-b-2 border-brand-charcoal pb-0.5 hover:text-brand-slate hover:border-brand-slate transition-colors"
                            >
                                {showReviewForm ? "Cancel" : "Write a Review"}
                            </button>
                        )}
                    </div>

                    <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-16">

                        {/* ── LEFT: Rating summary ── */}
                        <div className="mb-12 lg:mb-0">
                            {avgRating !== null ? (
                                <div className="space-y-6">
                                    {/* Big average */}
                                    <div>
                                        <p className="text-7xl font-black tracking-tighter leading-none">{avgRating.toFixed(1)}</p>
                                        <StarRow rating={avgRating} size={18} />
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-brand-slate/40 mt-2">
                                            Based on {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                                        </p>
                                    </div>
                                    {/* Breakdown bars */}
                                    <div className="space-y-2">
                                        {ratingBreakdown.map(row => (
                                            <div key={row.star} className="flex items-center gap-3">
                                                <span className="text-[9px] font-black w-4 text-right text-brand-slate/50">{row.star}</span>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill={row.count > 0 ? "#0A0A0A" : "none"} stroke="#0A0A0A" strokeWidth="1.5" className="shrink-0 opacity-50">
                                                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                                </svg>
                                                <div className="flex-1 bg-brand-surface h-1.5 overflow-hidden">
                                                    <div
                                                        className="h-full bg-brand-charcoal transition-all duration-500"
                                                        style={{ width: reviewCount > 0 ? `${(row.count / reviewCount) * 100}%` : "0%" }}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-bold text-brand-slate/40 w-4">{row.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-dashed border-brand-surface p-8 text-center">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/25 mb-3">No Reviews Yet</p>
                                    {hasPurchased && (
                                        <button
                                            onClick={() => setShowReviewForm(true)}
                                            className="text-[9px] font-black uppercase tracking-widest border-b border-brand-charcoal pb-px hover:text-brand-slate transition-colors"
                                        >
                                            Be the first →
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* User's existing review status */}
                            {userReview && (
                                <div className="mt-8 border border-brand-surface p-5 space-y-3">
                                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/30">Your Review</p>
                                    <StarRow rating={userReview.rating} size={14} />
                                    {userReview.title && <p className="text-xs font-black uppercase">{userReview.title}</p>}
                                    {userReview.body  && <p className="text-xs text-brand-slate/60 leading-relaxed">{userReview.body}</p>}
                                    <div className="flex items-center gap-4 pt-2">
                                        {!userReview.is_approved && (
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1">Pending Approval</span>
                                        )}
                                        <button
                                            onClick={() => { setReviewRating(userReview.rating); setReviewTitle(userReview.title ?? ""); setReviewBody(userReview.body ?? ""); setShowReviewForm(true); }}
                                            className="text-[8px] font-black uppercase tracking-widest border-b border-brand-charcoal pb-px hover:text-brand-slate transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteReview(userReview.id)}
                                            className="text-[8px] font-black uppercase tracking-widest border-b border-red-400 pb-px text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── RIGHT: Review form + list ── */}
                        <div>
                            {/* Write / edit review form */}
                            {showReviewForm && hasPurchased && (
                                <div className="border border-brand-charcoal p-8 mb-10 space-y-6">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">
                                        {userReview ? "Edit Your Review" : "Your Review"}
                                    </p>

                                    {/* Star picker */}
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-brand-slate/40 mb-3">Rating *</p>
                                        <div className="flex gap-2">
                                            {[1,2,3,4,5].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setReviewRating(s)}
                                                    className="transition-transform hover:scale-110"
                                                >
                                                    <svg width="28" height="28" viewBox="0 0 24 24"
                                                        fill={s <= reviewRating ? "#0A0A0A" : "none"}
                                                        stroke="#0A0A0A" strokeWidth="1.5"
                                                    >
                                                        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                                    </svg>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-brand-slate/40 mb-2">Title (optional)</p>
                                        <input
                                            type="text"
                                            value={reviewTitle}
                                            onChange={e => setReviewTitle(e.target.value)}
                                            placeholder="Summarise your experience..."
                                            maxLength={120}
                                            className="w-full border border-brand-surface px-4 py-3 text-xs font-medium outline-none focus:border-brand-charcoal transition-colors bg-white"
                                        />
                                    </div>

                                    {/* Body */}
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-brand-slate/40 mb-2">Review (optional)</p>
                                        <textarea
                                            value={reviewBody}
                                            onChange={e => setReviewBody(e.target.value)}
                                            placeholder="Tell others what you think about this drop..."
                                            maxLength={2000}
                                            rows={4}
                                            className="w-full border border-brand-surface px-4 py-3 text-xs font-medium outline-none focus:border-brand-charcoal transition-colors bg-white resize-none"
                                        />
                                        <p className="text-[8px] text-brand-slate/30 text-right mt-1">{reviewBody.length}/2000</p>
                                    </div>

                                    <div className="flex gap-4 items-center">
                                        <button
                                            onClick={handleSubmitReview}
                                            disabled={reviewRating === 0 || reviewSubmitting}
                                            className="px-8 py-3 bg-brand-charcoal text-white text-[9px] font-black uppercase tracking-widest hover:bg-brand-slate transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {reviewSubmitting ? "Submitting..." : "Submit Review"}
                                        </button>
                                        <button
                                            onClick={() => setShowReviewForm(false)}
                                            className="text-[9px] font-black uppercase tracking-widest text-brand-slate/40 hover:text-brand-charcoal transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    <p className="text-[8px] text-brand-slate/30 uppercase tracking-wider">
                                        Reviews are visible after admin approval.
                                    </p>
                                </div>
                            )}

                            {/* Not purchased notice */}
                            {!hasPurchased && !auth?.user && (
                                <div className="border border-dashed border-brand-surface p-6 mb-8 text-center">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-brand-slate/40">
                                        <Link href="/login" className="border-b border-brand-charcoal pb-px hover:text-brand-charcoal transition-colors">Log in</Link>
                                        {" "}and purchase to leave a review
                                    </p>
                                </div>
                            )}

                            {/* Review list */}
                            {reviews.length > 0 ? (
                                <div className="space-y-px">
                                    {reviews.map(review => (
                                        <div key={review.id} className="border-b border-brand-surface py-8 last:border-b-0">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div>
                                                    <StarRow rating={review.rating} size={14} />
                                                    {review.title && (
                                                        <p className="text-sm font-black uppercase tracking-tight mt-2">{review.title}</p>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-slate/50">{review.user_name}</p>
                                                    <p className="text-[8px] text-brand-slate/30 mt-0.5">
                                                        {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    </p>
                                                </div>
                                            </div>
                                            {review.body && (
                                                <p className="text-xs leading-loose text-brand-slate/60 font-medium">{review.body}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                !showReviewForm && (
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-brand-slate/30 py-8">
                                        No approved reviews yet. {hasPurchased ? "Be the first to share your thoughts." : ""}
                                    </p>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── RELATED PRODUCTS ── */}
            {related.length > 0 && (
                <section className="border-t border-brand-surface py-20 px-4">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/30 mb-2">
                                    You May Also Like
                                </p>
                                <h3 className="text-3xl font-black uppercase tracking-tightest">
                                    Related Drops
                                </h3>
                            </div>
                            <Link
                                href={route('shop.index')}
                                className="text-[9px] font-black uppercase tracking-widest border-b border-brand-charcoal pb-0.5 hover:text-brand-slate hover:border-brand-slate transition-colors"
                            >
                                View All →
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-brand-surface border border-brand-surface overflow-hidden">
                            {related.map(p => (
                                <RelatedCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
}

// ── Mini accordion ────────────────────────────────────────────────────────────
function AccordionRow({ label, body }: { label: string; body: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-brand-surface">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex justify-between items-center py-4 text-[10px] font-black uppercase tracking-widest text-brand-slate/50 hover:text-brand-charcoal transition-colors"
            >
                {label}
                <span className="text-base leading-none">{open ? "−" : "+"}</span>
            </button>
            {open && (
                <p className="pb-5 text-xs leading-loose text-brand-slate font-medium">
                    {body}
                </p>
            )}
        </div>
    );
}

// ── Related Card ──────────────────────────────────────────────────────────────
function RelatedCard({ product }: { product: { id: number; name: string; base_price: string; main_image_url: string | null; brand: string } }) {
    const [hovered, setHovered] = useState(false);
    return (
        <Link
            href={route("shop.show", product.id)}
            className="block bg-brand-white p-6 group transition-colors hover:bg-brand-surface/30 relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="aspect-square bg-brand-surface mb-5 overflow-hidden">
                <img
                    src={product.main_image_url || "https://via.placeholder.com/400"}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    style={{ mixBlendMode: "multiply" }}
                />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-slate/35 mb-1">{product.brand}</p>
            <h4 className="text-sm font-black uppercase tracking-tight leading-tight mb-3">{product.name}</h4>
            <div className="flex items-center justify-between">
                <p className="text-sm font-black">${parseFloat(product.base_price).toFixed(2)}</p>
                <span className={"text-[9px] font-black uppercase tracking-widest transition-all duration-200 border-b-2 pb-0.5 " + (hovered ? "border-brand-charcoal" : "border-transparent")}>
                    View →
                </span>
            </div>
        </Link>
    );
}

// ── Star Row ──────────────────────────────────────────────────────────────────
function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
    return (
        <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
            {[1,2,3,4,5].map(s => {
                const filled = s <= Math.floor(rating);
                const half   = !filled && s - 0.5 <= rating;
                return (
                    <svg key={s} width={size} height={size} viewBox="0 0 24 24"
                        fill={filled ? "#0A0A0A" : "none"}
                        stroke="#0A0A0A" strokeWidth="1.5"
                        style={{ opacity: filled || half ? 1 : 0.2 }}
                    >
                        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                );
            })}
        </div>
    );
}
