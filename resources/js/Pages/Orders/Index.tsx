import React, { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import CartDrawer from "@/Components/CartDrawer";

interface Order {
    id: number;
    order_number: string;
    total_amount: string;
    order_status: string;
    payment_status: string;
    delivery_status: string;
    placed_at: string;
    item_count: number;
    preview_name: string;
    payment_method: string | null;
}

interface Props {
    orders: Order[];
}

function StatusPill({ label, type }: { label: string; type: "order" | "payment" | "delivery" }) {
    const colorMap: Record<string, string> = {
        // Order status
        Confirmed:   "bg-emerald-50 text-emerald-700 border-emerald-200",
        Cancelled:   "bg-red-50 text-red-600 border-red-200",
        Processing:  "bg-blue-50 text-blue-700 border-blue-200",
        // Payment status
        Pending:     "bg-amber-50 text-amber-700 border-amber-200",
        Paid:        "bg-emerald-50 text-emerald-700 border-emerald-200",
        Failed:      "bg-red-50 text-red-600 border-red-200",
        // Delivery status
        Shipped:     "bg-blue-50 text-blue-700 border-blue-200",
        Delivered:   "bg-emerald-50 text-emerald-700 border-emerald-200",
        Returned:    "bg-red-50 text-red-600 border-red-200",
    };

    const cls = colorMap[label] ?? "bg-brand-surface text-brand-slate border-brand-surface";

    return (
        <span className={`inline-block border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${cls}`}>
            {label}
        </span>
    );
}

function formatDate(iso: string) {
    // Parse with timeZone:"UTC" so the displayed date matches the stored date.
    // Without this, e.g. 2026-03-14 21:51:30 UTC shows as Mar 15 in UTC+7.
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatPrice(val: string | number) {
    return `$${parseFloat(String(val)).toFixed(2)}`;
}

export default function OrdersIndex({ orders }: Props) {
    const { auth, cart }: any = usePage().props;
    const [isCartOpen, setIsCartOpen] = useState(false);
    const cartCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title="My Orders — SNEAKER.DRP" />

            {/* ── NAV ── */}
            <nav className="fixed top-0 w-full z-50 border-b border-brand-surface bg-brand-white/95 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center py-6">
                    {/* Left */}
                    <div className="flex-1 hidden lg:flex gap-6 text-[10px] font-black uppercase tracking-widest">
                        <Link href="/shop" className="hover:text-brand-slate transition-colors">
                            The Archive
                        </Link>
                        <Link href="/orders" className="border-b-2 border-brand-charcoal pb-0.5">
                            My Orders
                        </Link>
                    </div>

                    {/* Logo */}
                    <h1 className="text-2xl font-black tracking-tightest uppercase flex-shrink-0">
                        <Link href="/">SNEAKER.DRP</Link>
                    </h1>

                    {/* Right */}
                    <div className="flex-1 flex justify-end items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                        {auth?.user ? (
                            <>
                                <Link href="/profile" className="hover:text-brand-slate transition-colors">
                                    {auth.user.name}
                                </Link>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="hover:text-brand-slate transition-colors uppercase cursor-pointer"
                                >
                                    Log Out
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" className="hover:text-brand-slate transition-colors">
                                Account
                            </Link>
                        )}
                        <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-2 group">
                            <span>Vault</span>
                            <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px] group-hover:bg-brand-slate transition-colors">
                                {cartCount}
                            </span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── MAIN ── */}
            <main className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-16 border-b border-brand-surface pb-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-slate/40 mb-3">
                        Account
                    </p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-4xl font-black tracking-tightest uppercase">
                            Order History
                        </h2>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-slate/40">
                            {orders.length} {orders.length === 1 ? "Drop" : "Drops"} Secured
                        </span>
                    </div>
                </div>

                {/* Empty State */}
                {orders.length === 0 && (
                    <div className="text-center py-32 space-y-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-slate/30">
                            The Vault Is Empty
                        </p>
                        <p className="text-xs text-brand-slate/50 font-medium">
                            You haven't secured any drops yet.
                        </p>
                        <Link
                            href="/shop"
                            className="inline-block mt-4 bg-brand-charcoal text-brand-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-slate transition-colors"
                        >
                            Browse The Archive →
                        </Link>
                    </div>
                )}

                {/* Orders Table */}
                {orders.length > 0 && (
                    <div className="border border-brand-surface">
                        {/* Column Headers */}
                        <div className="grid grid-cols-12 gap-4 px-6 pb-4 text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/40">
                            <div className="col-span-1">#</div>
                            <div className="col-span-3">Order</div>
                            <div className="col-span-2">Date</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Payment</div>
                            <div className="col-span-1 text-right">Total</div>
                            <div className="col-span-1 text-right">Detail</div>
                        </div>

                        {orders.map((order, idx) => (
                            <div
                                key={order.id}
                                className="group grid grid-cols-12 gap-4 items-center px-6 py-6 bg-brand-white hover:bg-brand-surface/40 transition-colors border-b border-brand-surface last:border-b-0"
                            >
                                {/* Row # */}
                                <div className="col-span-1 text-[10px] font-black text-brand-slate/30 tabular-nums">
                                    {String(idx + 1).padStart(2, "0")}
                                </div>

                                {/* Order info */}
                                <div className="col-span-3 min-w-0">
                                    <p className="text-xs font-black uppercase truncate">
                                        {order.preview_name}
                                    </p>
                                    <p className="text-[9px] font-bold text-brand-slate/40 uppercase tracking-widest mt-0.5">
                                        {order.order_number}
                                    </p>
                                    <p className="text-[9px] text-brand-slate/40 mt-0.5">
                                        {order.item_count} {order.item_count === 1 ? "pair" : "pairs"}
                                    </p>
                                </div>

                                {/* Date */}
                                <div className="col-span-2 text-[10px] font-bold text-brand-slate/60 uppercase tracking-wider">
                                    {order.placed_at ? formatDate(order.placed_at) : "—"}
                                </div>

                                {/* Order status */}
                                <div className="col-span-2">
                                    <StatusPill label={order.order_status} type="order" />
                                    <div className="mt-1.5">
                                        <StatusPill label={order.delivery_status} type="delivery" />
                                    </div>
                                </div>

                                {/* Payment */}
                                <div className="col-span-2 space-y-1">
                                    <StatusPill label={order.payment_status} type="payment" />
                                    {order.payment_method && (
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-brand-slate/40">
                                            {order.payment_method}
                                        </p>
                                    )}
                                </div>

                                {/* Total */}
                                <div className="col-span-1 text-right text-xs font-black tabular-nums">
                                    {formatPrice(order.total_amount)}
                                </div>

                                {/* View link */}
                                <div className="col-span-1 text-right">
                                    <Link
                                        href={`/orders/${order.id}`}
                                        className="inline-block text-[9px] font-black uppercase tracking-widest border-b border-brand-charcoal/30 pb-px hover:border-brand-charcoal transition-colors opacity-40 group-hover:opacity-100"
                                    >
                                        View →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer CTA */}
                {orders.length > 0 && (
                    <div className="mt-20 pt-10 border-t border-brand-surface flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-slate/30">
                            Keep the vault growing
                        </p>
                        <Link
                            href="/shop"
                            className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-brand-charcoal pb-0.5 hover:text-brand-slate hover:border-brand-slate transition-colors"
                        >
                            Browse The Archive →
                        </Link>
                    </div>
                )}
            </main>
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
}
