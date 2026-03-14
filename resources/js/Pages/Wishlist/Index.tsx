import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import CartDrawer from "@/Components/CartDrawer";

interface WishlistItem {
    id: number;
    product_id: number;
    name: string;
    brand: string;
    category: string;
    base_price: string;
    image_url: string | null;
    is_active: boolean;
    added_at: string;
}

interface Props {
    items: WishlistItem[];
}

export default function WishlistIndex({ items }: Props) {
    const { auth, cart }: any = usePage().props;
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [removingId, setRemovingId] = useState<number | null>(null);

    const cartCount = cart?.items?.reduce((a: number, i: any) => a + i.quantity, 0) || 0;

    const handleRemove = (id: number) => {
        setRemovingId(id);
        router.delete(route("wishlist.destroy", id), {
            preserveScroll: true,
            onSuccess: () => setRemovingId(null),
        });
    };

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title="Wishlist — SNEAKER.DRP" />

            {/* ── NAV ── */}
            <nav className="border-b border-brand-surface py-5 sticky top-0 bg-brand-white/90 backdrop-blur-md z-50">
                <div className="mx-auto max-w-7xl px-4 flex justify-between items-center">
                    <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest">
                        <Link href={route("home")} className="text-xl tracking-tightest">
                            SNEAKER.DRP
                        </Link>
                        <Link href={route("shop.index")} className="text-brand-slate/40 hover:text-brand-charcoal transition-colors">
                            Shop
                        </Link>
                        <Link href={route("orders.index")} className="text-brand-slate/40 hover:text-brand-charcoal transition-colors">
                            Orders
                        </Link>
                        <span className="border-b-2 border-brand-charcoal pb-0.5">Wishlist</span>
                    </div>

                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                        {auth?.user && (
                            <Link href={route("profile.edit")} className="text-brand-slate/40 hover:text-brand-charcoal transition-colors">
                                {auth.user.name}
                            </Link>
                        )}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="flex items-center gap-2 hover:text-brand-slate transition-colors"
                        >
                            Vault
                            <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px]">
                                {cartCount}
                            </span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HEADER ── */}
            <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 border-b border-brand-surface">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/30 mb-3">
                    Your Collection
                </p>
                <div className="flex items-end justify-between">
                    <h1 className="text-5xl font-black uppercase tracking-tightest leading-none">
                        Wishlist
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-slate/40 italic">
                        {items.length} {items.length === 1 ? "item" : "items"} saved
                    </p>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <main className="mx-auto max-w-7xl px-4 py-12 pb-24">

                {/* Empty state */}
                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-40 space-y-8">
                        {/* Big heart outline */}
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-brand-slate/15">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-slate/25">
                                Nothing Saved Yet
                            </p>
                            <p className="text-xs text-brand-slate/40 font-medium">
                                Hit the heart on any product to save it here.
                            </p>
                        </div>
                        <Link
                            href={route("shop.index")}
                            className="bg-brand-charcoal text-brand-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-slate transition-colors"
                        >
                            Browse The Archive →
                        </Link>
                    </div>
                )}

                {/* Grid */}
                {items.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-brand-surface border border-brand-surface overflow-hidden">
                            {items.map(item => (
                                <WishlistCard
                                    key={item.id}
                                    item={item}
                                    removing={removingId === item.id}
                                    onRemove={() => handleRemove(item.id)}
                                />
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-brand-surface flex justify-between items-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-brand-slate/25">
                                {items.length} drop{items.length !== 1 ? "s" : ""} saved
                            </p>
                            <Link
                                href={route("shop.index")}
                                className="text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-brand-charcoal pb-0.5 hover:text-brand-slate hover:border-brand-slate transition-colors"
                            >
                                Continue Shopping →
                            </Link>
                        </div>
                    </>
                )}
            </main>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
}

// ── Wishlist Card ─────────────────────────────────────────────────────────────
function WishlistCard({
    item,
    removing,
    onRemove,
}: {
    item: WishlistItem;
    removing: boolean;
    onRemove: () => void;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={`relative bg-brand-white p-6 transition-opacity duration-300 ${removing ? "opacity-40 pointer-events-none" : "opacity-100"}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Remove heart button */}
            <button
                onClick={onRemove}
                title="Remove from Wishlist"
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-red-50 transition-colors group"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A0A0A" stroke="#0A0A0A" strokeWidth="1.5" className="group-hover:fill-red-500 group-hover:stroke-red-500 transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            </button>

            {/* Out of stock badge */}
            {!item.is_active && (
                <div className="absolute top-4 left-4 z-10 bg-brand-charcoal text-brand-white text-[7px] font-black uppercase tracking-widest px-2 py-1">
                    Unavailable
                </div>
            )}

            {/* Image */}
            <Link href={route("shop.show", item.product_id)}>
                <div className="aspect-square bg-brand-surface mb-5 overflow-hidden">
                    <img
                        src={item.image_url || "https://via.placeholder.com/400"}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        style={{
                            transform: hovered ? "scale(1.06)" : "scale(1)",
                            transition: "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)",
                            mixBlendMode: "multiply",
                        }}
                    />
                </div>
            </Link>

            {/* Info */}
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/35 mb-1">
                {item.brand}
            </p>
            <Link href={route("shop.show", item.product_id)}>
                <h3 className="text-sm font-black uppercase tracking-tight leading-tight mb-3 hover:text-brand-slate transition-colors">
                    {item.name}
                </h3>
            </Link>
            <div className="flex items-center justify-between">
                <p className="text-sm font-black tabular-nums">
                    ${parseFloat(item.base_price).toFixed(2)}
                </p>
                <Link
                    href={route("shop.show", item.product_id)}
                    className="text-[8px] font-black uppercase tracking-widest border-b border-brand-charcoal pb-px hover:text-brand-slate hover:border-brand-slate transition-colors"
                >
                    Select Size →
                </Link>
            </div>
        </div>
    );
}
