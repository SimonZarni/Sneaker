import React, { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import CartDrawer from "@/Components/CartDrawer";
import Pagination from "@/Components/Pagination";
import NotificationBell from "@/Components/NotificationBell";

interface Order {
    id: number;
    order_number: string;
    total_amount: string;
    payment_status: string;
    delivery_status: string;
    placed_at: string;
    item_count: number;
    preview_name: string;
    payment_method: string | null;
}

interface PaginatedOrders {
    data: Order[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: any[];
}

interface Props {
    orders: PaginatedOrders;
}

function StatusPill({ label }: { label: string }) {
    const colorMap: Record<string, string> = {
        Confirmed:  "bg-emerald-50 text-emerald-700 border-emerald-200",
        Cancelled:  "bg-red-50 text-red-600 border-red-200",
        Processing: "bg-blue-50 text-blue-700 border-blue-200",
        Pending:    "bg-amber-50 text-amber-700 border-amber-200",
        Paid:       "bg-emerald-50 text-emerald-700 border-emerald-200",
        COD:        "bg-gray-50 text-gray-600 border-gray-200",
        Refunded:   "bg-purple-50 text-purple-700 border-purple-200",
        Failed:     "bg-red-50 text-red-600 border-red-200",
        Shipped:    "bg-blue-50 text-blue-700 border-blue-200",
        Delivered:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
    const cls = colorMap[label] ?? "bg-gray-50 text-gray-600 border-gray-200";
    return (
        <span className={`inline-block border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${cls}`}>
            {label}
        </span>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
    });
}

function formatPrice(val: string | number) {
    return `$${parseFloat(String(val)).toFixed(2)}`;
}

export default function OrdersIndex({ orders }: Props) {
    const { auth, cart }: any = usePage().props;
    const [isCartOpen,     setIsCartOpen]     = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const cartCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;

    const isEmpty = orders.data.length === 0;

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title="My Orders — SNEAKER.DRP" />

            {/* ── MOBILE SIDEBAR ── */}
            <div className={`fixed inset-0 z-[60] transition-all duration-300 ${mobileMenuOpen ? "visible" : "invisible"}`}>
                <div className={`absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setMobileMenuOpen(false)} />
                <div className={`absolute top-0 right-0 h-full w-72 bg-brand-white flex flex-col transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
                    <div className="flex items-center justify-between px-6 py-6 border-b border-brand-surface">
                        <span className="text-xs font-black uppercase tracking-widest">Menu</span>
                        <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:opacity-50 transition-opacity">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <nav className="flex flex-col flex-1 px-6 py-8 overflow-y-auto">
                        {[
                            { label: "The Archive", href: "/shop" },
                            { label: "My Orders",   href: "/orders" },
                        ].map(item => (
                            <Link key={item.label} href={item.href} prefetch onClick={() => setMobileMenuOpen(false)}
                                className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors text-brand-charcoal">
                                {item.label}
                            </Link>
                        ))}
                        {auth?.user ? (
                            <>
                                <Link href="/profile" prefetch onClick={() => setMobileMenuOpen(false)}
                                    className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors">
                                    {auth.user.name}
                                </Link>
                                <Link href="/logout" method="post" as="button" onClick={() => setMobileMenuOpen(false)}
                                    className="text-left text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors cursor-pointer">
                                    Log Out
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" prefetch onClick={() => setMobileMenuOpen(false)}
                                className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors">
                                Account
                            </Link>
                        )}
                        <button onClick={() => { setMobileMenuOpen(false); setIsCartOpen(true); }}
                            className="flex items-center justify-between text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors">
                            <span>Vault</span>
                            <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px]">{cartCount}</span>
                        </button>
                    </nav>
                    <div className="px-6 py-6 border-t border-brand-surface">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/30">SNEAKER.DRP © 2026</p>
                    </div>
                </div>
            </div>

            {/* ── NAV ── */}
            <nav className="fixed top-0 w-full z-50 border-b border-brand-surface bg-brand-white/95 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center py-6">
                    {/* Desktop left */}
                    <div className="flex-1 hidden lg:flex gap-6 text-[10px] font-black uppercase tracking-widest">
                        <Link href="/shop" prefetch className="hover:text-brand-slate transition-colors">The Archive</Link>
                        <Link href="/orders" prefetch className="border-b-2 border-brand-charcoal pb-0.5">My Orders</Link>
                    </div>
                    <h1 className="text-2xl font-black tracking-tightest uppercase flex-shrink-0">
                        <Link href="/">SNEAKER.DRP</Link>
                    </h1>
                    {/* Desktop right */}
                    <div className="flex-1 hidden lg:flex justify-end items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                        {auth?.user ? (
                            <>
                                <Link href="/profile" prefetch className="hover:text-brand-slate transition-colors">{auth.user.name}</Link>
                                <Link href="/logout" method="post" as="button" className="hover:text-brand-slate transition-colors uppercase cursor-pointer">Log Out</Link>
                                <NotificationBell userId={auth.user.id} />
                            </>
                        ) : (
                            <Link href="/login" prefetch className="hover:text-brand-slate transition-colors">Account</Link>
                        )}
                        <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-2 group">
                            <span>Vault</span>
                            <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px] group-hover:bg-brand-slate transition-colors">{cartCount}</span>
                        </button>
                    </div>
                    {/* Mobile right */}
                    <div className="flex lg:hidden items-center gap-4 ml-auto">
                        {auth?.user && <NotificationBell userId={auth.user.id} />}
                        <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                            <span>Vault</span>
                            <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px]">{cartCount}</span>
                        </button>
                        <button onClick={() => setMobileMenuOpen(true)} className="p-1 hover:opacity-50 transition-opacity" aria-label="Open menu">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── MAIN ── */}
            <main className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-10 sm:mb-16 border-b border-brand-surface pb-8 sm:pb-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-slate/40 mb-3">Account</p>
                    <div className="flex items-end justify-between gap-4">
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tightest uppercase">Order History</h2>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-slate/40 text-right shrink-0">
                            {orders.total} {orders.total === 1 ? "Drop" : "Drops"}<br className="sm:hidden" /> Secured
                        </span>
                    </div>
                </div>

                {/* Empty State */}
                {isEmpty && (
                    <div className="text-center py-32 space-y-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-slate/30">The Vault Is Empty</p>
                        <p className="text-xs text-brand-slate/50 font-medium">You haven't secured any drops yet.</p>
                        <Link href="/shop" className="inline-block mt-4 bg-brand-charcoal text-brand-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-slate transition-colors">
                            Browse The Archive →
                        </Link>
                    </div>
                )}

                {/* ── ORDERS LIST ── */}
                {!isEmpty && (
                    <>
                        {/* Desktop table header — hidden on mobile */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 pb-4 text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/40 border border-brand-surface border-b-0">
                            <div className="col-span-1">#</div>
                            <div className="col-span-3">Order</div>
                            <div className="col-span-2">Date</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Payment</div>
                            <div className="col-span-1 text-right">Total</div>
                            <div className="col-span-1 text-right">Detail</div>
                        </div>

                        <div className="border border-brand-surface">
                            {orders.data.map((order, idx) => (
                                <div key={order.id} className="border-b border-brand-surface last:border-b-0">

                                    {/* ── MOBILE CARD ── */}
                                    <div className="md:hidden p-4 hover:bg-brand-surface/30 transition-colors">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-black uppercase truncate">{order.preview_name}</p>
                                                <p className="text-[9px] font-bold text-brand-slate/40 uppercase tracking-widest mt-0.5 truncate">{order.order_number}</p>
                                                <p className="text-[9px] text-brand-slate/40 mt-0.5">
                                                    {order.item_count} {order.item_count === 1 ? "pair" : "pairs"} · {order.placed_at ? formatDate(order.placed_at) : "—"}
                                                </p>
                                            </div>
                                            <p className="text-sm font-black tabular-nums shrink-0">{formatPrice(order.total_amount)}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-wrap gap-2">
                                                <StatusPill label={order.delivery_status} />
                                                <StatusPill label={order.payment_status} />
                                            </div>
                                            <Link href={`/orders/${order.id}`}
                                                className="text-[9px] font-black uppercase tracking-widest border-b border-brand-charcoal pb-px hover:text-brand-slate transition-colors">
                                                View →
                                            </Link>
                                        </div>
                                    </div>

                                    {/* ── DESKTOP ROW ── */}
                                    <div className="hidden md:grid group grid-cols-12 gap-4 items-center px-6 py-6 bg-brand-white hover:bg-brand-surface/40 transition-colors">
                                        <div className="col-span-1 text-[10px] font-black text-brand-slate/30 tabular-nums">
                                            {String((orders.from ?? 0) + idx).padStart(2, "0")}
                                        </div>
                                        <div className="col-span-3 min-w-0">
                                            <p className="text-xs font-black uppercase truncate">{order.preview_name}</p>
                                            <p className="text-[9px] font-bold text-brand-slate/40 uppercase tracking-widest mt-0.5">{order.order_number}</p>
                                            <p className="text-[9px] text-brand-slate/40 mt-0.5">{order.item_count} {order.item_count === 1 ? "pair" : "pairs"}</p>
                                        </div>
                                        <div className="col-span-2 text-[10px] font-bold text-brand-slate/60 uppercase tracking-wider">
                                            {order.placed_at ? formatDate(order.placed_at) : "—"}
                                        </div>
                                        <div className="col-span-2">
                                            <StatusPill label={order.delivery_status} />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <StatusPill label={order.payment_status} />
                                            {order.payment_method && (
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-slate/40">{order.payment_method}</p>
                                            )}
                                        </div>
                                        <div className="col-span-1 text-right text-xs font-black tabular-nums">
                                            {formatPrice(order.total_amount)}
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <Link href={`/orders/${order.id}`} className="inline-block text-[9px] font-black uppercase tracking-widest border-b border-brand-charcoal/30 pb-px hover:border-brand-charcoal transition-colors opacity-40 group-hover:opacity-100">
                                                View →
                                            </Link>
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <Pagination data={orders} />

                        {/* Footer CTA */}
                        <div className="mt-16 sm:mt-20 pt-10 border-t border-brand-surface flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-slate/30">Keep the vault growing</p>
                            <Link href="/shop" className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-brand-charcoal pb-0.5 hover:text-brand-slate hover:border-brand-slate transition-colors">
                                Browse The Archive →
                            </Link>
                        </div>
                    </>
                )}
            </main>
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
}
