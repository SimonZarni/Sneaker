import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";

// Components
import CartDrawer from "@/Components/CartDrawer";
import SizeGuideModal from "@/Components/SizeGuideModal";

// Types
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

export default function Show({
    product,
    wishlisted: initialWishlisted,
    related,
    reviews,
    avgRating,
    reviewCount,
    ratingBreakdown,
    userReview: initialUserReview,
    hasPurchased
}: Props) {
    const { cart, auth }: any = usePage().props;

    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [selectedSize,  setSelectedSize]  = useState<number | null>(null);
    const [isCartOpen,    setIsCartOpen]    = useState(false);
    const [addedFlash,    setAddedFlash]    = useState(false);
    const [wishlisted,    setWishlisted]    = useState(initialWishlisted);
    const [wishFlash,     setWishFlash]     = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);

    // Review form state
    const [showReviewForm,   setShowReviewForm]   = useState(false);
    const [reviewRating,     setReviewRating]     = useState(initialUserReview?.rating ?? 0);
    const [reviewTitle,      setReviewTitle]      = useState(initialUserReview?.title ?? "");
    const [reviewBody,       setReviewBody]       = useState(initialUserReview?.body ?? "");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    // ── Derived Data ──────────────────────────────────────────────────────────

    const uniqueColors = product.variants
        .map(v => v.color)
        .filter((c, i, self) => c && self.findIndex(t => t.id === c.id) === i);

    const sizesForColor = selectedColor === null ? [] : product.variants
        .filter(v => v.color?.id === selectedColor)
        .map(v => ({ id: v.size.id, size_value: v.size.size_value, stock: v.stock_quantity }))
        .sort((a, b) => parseFloat(a.size_value) - parseFloat(b.size_value));

    const allUniqueSizes = product.variants
        .map(v => v.size)
        .filter((s, i, self) => s && self.findIndex(t => t.id === s.id) === i)
        .sort((a, b) => parseFloat(a.size_value) - parseFloat(b.size_value));

    const selectedVariant = product.variants.find(v => v.color?.id === selectedColor && v.size?.id === selectedSize);
    const currentColor    = uniqueColors.find(c => c.id === selectedColor);
    const isOutOfStock    = selectedVariant?.stock_quantity === 0;
    const lowStock        = selectedVariant && selectedVariant.stock_quantity > 0 && selectedVariant.stock_quantity < 5;
    const colorHasNoStock = selectedColor !== null && sizesForColor.every(s => s.stock === 0);

    const activeImage = (selectedColor !== null
        ? product.variants.find(v => v.color?.id === selectedColor && v.image_url)?.image_url
        : null) || product.main_image_url;

    const cartCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleWishlist = () => {
        if (!auth?.user) return router.visit('/login');
        router.post(route('wishlist.toggle'), { product_id: product.id }, {
            preserveScroll: true,
            onSuccess: () => {
                setWishlisted(!wishlisted);
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
            rating: reviewRating,
            title: reviewTitle,
            body: reviewBody,
        }, {
            preserveScroll: true,
            onSuccess: () => { setShowReviewForm(false); setReviewSubmitting(false); },
            onError: () => setReviewSubmitting(false),
        });
    };

    const handleAddToVault = () => {
        if (!selectedVariant || isOutOfStock) return;
        router.post("/cart", { product_variant_id: selectedVariant.id, quantity: 1 }, {
            preserveScroll: true,
            onSuccess: () => {
                setAddedFlash(true);
                setTimeout(() => setAddedFlash(false), 1800);
                setIsCartOpen(true);
            },
        });
    };

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title={`${product.brand.name} ${product.name} — SNEAKER.DRP`} />

            {/* Nav */}
            <nav className="border-b border-brand-surface py-5 sticky top-0 bg-brand-white/90 backdrop-blur-md z-50">
                <div className="mx-auto max-w-7xl px-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <Link href="/shop" className="hover:text-brand-slate transition-colors">← Collection</Link>
                    <Link href="/" className="text-xl tracking-tightest">SNEAKER.DRP</Link>
                    <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-2">
                        Vault <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px]">{cartCount}</span>
                    </button>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-4 py-12 lg:flex lg:gap-x-16">
                {/* Gallery */}
                <div className="lg:w-[60%]">
                    <div className="aspect-[4/5] bg-brand-surface overflow-hidden border border-brand-surface">
                        <img key={activeImage} src={activeImage} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt={product.name} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:w-[40%] mt-12 lg:mt-0 lg:sticky lg:top-28 lg:h-fit">
                    <div className="border-b border-brand-surface pb-8">
                        <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-brand-slate/40">
                            <span>{product.brand.name}</span><span className="w-1 h-1 bg-brand-slate/20 rounded-full" /><span>{product.category.name}</span>
                        </div>
                        <h2 className="text-5xl font-black uppercase tracking-tightest leading-[0.85] mb-6">{product.name}</h2>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-medium tracking-tighter">${product.base_price}</p>
                            <button onClick={handleWishlist} className="flex items-center gap-2 group">
                                <HeartIcon filled={wishlisted} flash={wishFlash} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-brand-slate/40 group-hover:text-brand-charcoal">{wishlisted ? "Saved" : "Save"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Colorway Selection */}
                    <div className="py-8 border-b border-brand-surface">
                        <div className="flex justify-between items-end mb-5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-slate/50">Colorway</span>
                            <span className="text-[10px] font-bold uppercase">{currentColor?.name ?? "Select a color"}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {uniqueColors.map(color => {
                                const totalStock = product.variants.filter(v => v.color?.id === color.id).reduce((sum, v) => sum + v.stock_quantity, 0);
                                const fullyOut = totalStock === 0;
                                return (
                                    <button key={color.id} onClick={() => !fullyOut && setSelectedColor(color.id)} disabled={fullyOut}
                                        className={`relative w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color.id ? "border-brand-charcoal scale-110 ring-4 ring-brand-surface" : fullyOut ? "opacity-30 cursor-not-allowed" : "border-brand-surface hover:border-brand-charcoal"}`}
                                        style={{ backgroundColor: color.hex_code }}>
                                        {fullyOut && <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(to bottom-right, transparent 45%, #999 45%, #999 55%, transparent 55%)" }} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div className="py-8 border-b border-brand-surface">
                        <div className="flex justify-between items-center mb-5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-slate/50">Size (US)</span>
                            <button onClick={() => setShowSizeGuide(true)} className="text-[10px] font-bold uppercase border-b border-brand-charcoal">Size Guide</button>
                        </div>
                        <div className="grid grid-cols-4 gap-px bg-brand-surface border border-brand-surface">
                            {(selectedColor === null ? allUniqueSizes : sizesForColor).map(size => (
                                <button key={size.id} disabled={selectedColor === null || ('stock' in size && size.stock === 0)}
                                    onClick={() => setSelectedSize(size.id)}
                                    className={`py-5 text-xs font-bold uppercase relative ${selectedSize === size.id ? "bg-brand-charcoal text-brand-white" : (selectedColor === null || ('stock' in size && size.stock === 0)) ? "bg-white text-brand-slate/20 cursor-not-allowed" : "bg-white hover:bg-brand-surface"}`}>
                                    {size.size_value}
                                    {selectedColor !== null && ('stock' in size && size.stock === 0) && <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom-right, transparent 45%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.1) 55%, transparent 55%)" }} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Add to Vault */}
                    <div className="pt-6">
                        <button onClick={handleAddToVault} disabled={!selectedVariant || isOutOfStock}
                            className={`w-full py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${addedFlash ? "bg-emerald-600 text-white" : !selectedVariant || isOutOfStock ? "bg-brand-surface text-brand-slate/30 cursor-not-allowed" : "bg-brand-charcoal text-brand-white hover:bg-brand-slate"}`}>
                            {addedFlash ? "✓ Added to Vault" : isOutOfStock ? "Sold Out" : !selectedColor ? "Select Color" : !selectedSize ? "Select Size" : "Add to Vault"}
                        </button>
                    </div>

                    {/* Description & Accordions */}
                    <div className="pt-10 border-t border-brand-surface mt-8 space-y-6">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-brand-slate/50">The Story</h4>
                        <p className="text-xs leading-loose text-brand-slate font-medium">{product.description}</p>
                        <div className="pt-4 space-y-px">
                            <AccordionRow label="Free Shipping & Returns" body="Complimentary shipping on all orders. Easy 30-day returns." />
                            <AccordionRow label="Authenticity Guaranteed" body="Every pair in the vault is verified authentic." />
                        </div>
                    </div>
                </div>
            </main>

            {/* Reviews & Related Sections (Separated for clarity) */}
            <ReviewSection {...{avgRating, reviewCount, ratingBreakdown, hasPurchased, initialUserReview, reviews, product, reviewRating, setReviewRating, reviewTitle, setReviewTitle, reviewBody, setReviewBody, showReviewForm, setShowReviewForm, handleSubmitReview, reviewSubmitting }} auth={auth} />

            {related.length > 0 && <RelatedSection related={related} />}

            {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} />}
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
}

// ── Sub-Components (Keep at bottom for clean Show function) ──────────────────

function AccordionRow({ label, body }: { label: string; body: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-brand-surface">
            <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center py-4 text-[10px] font-black uppercase tracking-widest text-brand-slate/50 hover:text-brand-charcoal">
                {label} <span>{open ? "−" : "+"}</span>
            </button>
            {open && <p className="pb-5 text-xs leading-loose text-brand-slate font-medium">{body}</p>}
        </div>
    );
}

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
    return (
        <div className="flex gap-0.5 items-center">
            {[1,2,3,4,5].map(s => (
                <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.floor(rating) ? "#0A0A0A" : "none"} stroke="#0A0A0A" strokeWidth="1.5" className={s <= Math.floor(rating) ? "opacity-100" : "opacity-20"}>
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
            ))}
        </div>
    );
}

function HeartIcon({ filled, flash }: { filled: boolean; flash: boolean }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "#0A0A0A" : "none"} stroke="#0A0A0A" strokeWidth="1.5" className={`transition-transform duration-200 ${flash ? "scale-125" : "scale-100"}`}>
            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
    );
}

// ── Sections (Extracted for better readability) ────────────────────────────────

function ReviewSection({ avgRating, reviewCount, ratingBreakdown, hasPurchased, initialUserReview, reviews, product, reviewRating, setReviewRating, reviewTitle, setReviewTitle, reviewBody, setReviewBody, showReviewForm, setShowReviewForm, handleSubmitReview, reviewSubmitting, auth }: any) {
    return (
        <section className="border-t border-brand-surface py-20 px-4">
            <div className="mx-auto max-w-7xl">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/30 mb-2">Customer Feedback</p>
                        <h3 className="text-3xl font-black uppercase tracking-tightest">Reviews {reviewCount > 0 && <span className="ml-4 text-lg font-medium text-brand-slate/40 normal-case">({reviewCount})</span>}</h3>
                    </div>
                    {hasPurchased && !initialUserReview && (
                        <button onClick={() => setShowReviewForm(!showReviewForm)} className="text-[9px] font-black uppercase tracking-widest border-b-2 border-brand-charcoal pb-0.5">{showReviewForm ? "Cancel" : "Write a Review"}</button>
                    )}
                </div>

                <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-16">
                    <div>
                        {avgRating ? (
                            <div className="space-y-6">
                                <p className="text-7xl font-black tracking-tighter leading-none">{avgRating.toFixed(1)}</p>
                                <StarRow rating={avgRating} size={18} />
                                <div className="space-y-2">
                                    {ratingBreakdown.map((row: any) => (
                                        <div key={row.star} className="flex items-center gap-3">
                                            <span className="text-[9px] font-black w-4 text-brand-slate/50">{row.star}</span>
                                            <div className="flex-1 bg-brand-surface h-1.5 overflow-hidden"><div className="h-full bg-brand-charcoal" style={{ width: `${(row.count / reviewCount) * 100}%` }} /></div>
                                            <span className="text-[9px] font-bold text-brand-slate/40 w-4">{row.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : <p className="text-[9px] font-black uppercase tracking-widest text-brand-slate/25">No Reviews Yet</p>}
                    </div>

                    <div>
                        {showReviewForm && (
                            <div className="border border-brand-charcoal p-8 mb-10 space-y-6">
                                <div className="flex gap-2">
                                    {[1,2,3,4,5].map(s => (
                                        <button key={s} onClick={() => setReviewRating(s)}><StarRow rating={s} size={28} /></button>
                                    ))}
                                </div>
                                <input type="text" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="Summarise your experience..." className="w-full border border-brand-surface px-4 py-3 text-xs outline-none" />
                                <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} placeholder="Tell others what you think..." className="w-full border border-brand-surface px-4 py-3 text-xs outline-none h-32 resize-none" />
                                <button onClick={handleSubmitReview} disabled={reviewRating === 0 || reviewSubmitting} className="px-8 py-3 bg-brand-charcoal text-white text-[9px] font-black uppercase tracking-widest">{reviewSubmitting ? "Submitting..." : "Submit Review"}</button>
                            </div>
                        )}
                        {reviews.map((r: any) => (
                            <div key={r.id} className="border-b border-brand-surface py-8 last:border-b-0">
                                <div className="flex justify-between mb-3">
                                    <StarRow rating={r.rating} size={14} />
                                    <span className="text-[9px] font-black uppercase text-brand-slate/50">{r.user_name}</span>
                                </div>
                                <p className="text-sm font-black uppercase mb-2">{r.title}</p>
                                <p className="text-xs leading-loose text-brand-slate/60">{r.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function RelatedSection({ related }: { related: RelatedProduct[] }) {
    return (
        <section className="border-t border-brand-surface py-20 px-4">
            <div className="mx-auto max-w-7xl">
                <h3 className="text-3xl font-black uppercase tracking-tightest mb-12">Related Drops</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-brand-surface border border-brand-surface overflow-hidden">
                    {related.map(p => (
                        <Link key={p.id} href={route("shop.show", p.id)} className="block bg-brand-white p-6 group">
                            <div className="aspect-square bg-brand-surface mb-5 overflow-hidden">
                                <img src={p.main_image_url || ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                            </div>
                            <p className="text-[9px] font-black uppercase text-brand-slate/35 mb-1">{p.brand}</p>
                            <h4 className="text-sm font-black uppercase mb-3">{p.name}</h4>
                            <p className="text-sm font-black">${parseFloat(p.base_price).toFixed(2)}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
