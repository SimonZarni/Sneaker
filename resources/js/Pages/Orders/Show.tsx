import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";

interface OrderItem {
    id: number;
    product_id: number;
    product_name: string;
    brand_name: string;
    color_name: string;
    size_value: string;
    unit_price: string;
    quantity: number;
    subtotal: string;
    image_url: string | null;
}

interface Order {
    id: number;
    order_number: string;
    total_amount: string;
    order_status: string;
    payment_status: string;
    delivery_status: string;
    placed_at: string;
    shipping_full_name: string;
    shipping_phone: string;
    shipping_address_line: string;
    shipping_city: string;
    shipping_state_region: string | null;
    shipping_postal_code: string | null;
    shipping_country: string;
    payment_method: string | null;
    payment_status_detail: string | null;
    items: OrderItem[];
}

interface Props {
    order: Order;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
}

function formatPrice(val: string | number) {
    return `$${parseFloat(String(val)).toFixed(2)}`;
}

function StatusPill({ label }: { label: string }) {
    const colorMap: Record<string, string> = {
        Confirmed:  "bg-emerald-50 text-emerald-700 border-emerald-200",
        Cancelled:  "bg-red-50 text-red-600 border-red-200",
        Processing: "bg-blue-50 text-blue-700 border-blue-200",
        Pending:    "bg-amber-50 text-amber-700 border-amber-200",
        Paid:       "bg-emerald-50 text-emerald-700 border-emerald-200",
        Failed:     "bg-red-50 text-red-600 border-red-200",
        Shipped:    "bg-blue-50 text-blue-700 border-blue-200",
        Delivered:  "bg-emerald-50 text-emerald-700 border-emerald-200",
        Returned:   "bg-red-50 text-red-600 border-red-200",
    };
    const cls = colorMap[label] ?? "bg-brand-surface text-brand-slate border-brand-surface";
    return (
        <span className={`inline-block border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${cls}`}>
            {label}
        </span>
    );
}

// ── Delivery Timeline ─────────────────────────────────────────────────────────

const DELIVERY_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

function DeliveryTimeline({ current }: { current: string }) {
    const idx = DELIVERY_STEPS.indexOf(current);
    return (
        <div className="flex items-center gap-0">
            {DELIVERY_STEPS.map((step, i) => {
                const done    = i <= idx;
                const active  = i === idx;
                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-3 h-3 rounded-full border-2 transition-colors ${
                                    active
                                        ? "border-brand-charcoal bg-brand-charcoal"
                                        : done
                                        ? "border-brand-charcoal bg-brand-charcoal"
                                        : "border-brand-surface bg-brand-white"
                                }`}
                            />
                            <span
                                className={`mt-2 text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${
                                    active ? "text-brand-charcoal" : done ? "text-brand-slate/60" : "text-brand-slate/20"
                                }`}
                            >
                                {step}
                            </span>
                        </div>
                        {i < DELIVERY_STEPS.length - 1 && (
                            <div
                                className={`flex-1 h-px mx-1 mb-5 transition-colors ${
                                    i < idx ? "bg-brand-charcoal" : "bg-brand-surface"
                                }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OrdersShow({ order }: Props) {
    const { auth, cart }: any = usePage().props;
    const cartCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;

    const shippingTotal = 0; // Free shipping — adjust as needed
    const tax = parseFloat(order.total_amount) * 0.07; // 7% tax example

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title={`${order.order_number} — SNEAKER.DRP`} />

            {/* ── NAV ── */}
            <nav className="fixed top-0 w-full z-50 border-b border-brand-surface bg-brand-white/95 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center py-6">
                    <div className="flex-1 hidden lg:flex gap-6 text-[10px] font-black uppercase tracking-widest">
                        <Link href="/shop" className="hover:text-brand-slate transition-colors">
                            The Archive
                        </Link>
                        <Link href="/orders" className="hover:text-brand-slate transition-colors">
                            My Orders
                        </Link>
                    </div>

                    <h1 className="text-2xl font-black tracking-tightest uppercase flex-shrink-0">
                        <Link href="/">SNEAKER.DRP</Link>
                    </h1>

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
                        <Link href="/shop" className="flex items-center gap-2 group">
                            <span>Vault</span>
                            <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px] group-hover:bg-brand-slate transition-colors">
                                {cartCount}
                            </span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── MAIN ── */}
            <main className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb */}
                <div className="mb-10 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/40">
                    <Link href="/orders" className="hover:text-brand-charcoal transition-colors">
                        Orders
                    </Link>
                    <span>/</span>
                    <span className="text-brand-charcoal">{order.order_number}</span>
                </div>

                {/* ── PAGE HEADER ── */}
                <div className="mb-16 border-b border-brand-surface pb-10">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-slate/40 mb-2">
                                Drop Receipt
                            </p>
                            <h2 className="text-4xl font-black tracking-tightest uppercase">
                                {order.order_number}
                            </h2>
                            {order.placed_at && (
                                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-brand-slate/40">
                                    Placed {formatDate(order.placed_at)}
                                </p>
                            )}
                        </div>

                        {/* <div className="flex flex-wrap items-center gap-3">
                            <StatusPill label={order.order_status} />
                            <StatusPill label={order.payment_status} />
                            <StatusPill label={order.delivery_status} />
                        </div> */}
                    </div>
                </div>

                {/* ── DELIVERY TIMELINE ── */}
                <section className="mb-20 p-8 bg-brand-surface/30 border border-brand-surface">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/40 mb-8">
                        Delivery Progress
                    </p>
                    <DeliveryTimeline current={order.delivery_status} />
                </section>

                {/* ── TWO-COLUMN LAYOUT ── */}
                <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-16">

                    {/* LEFT: Items */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-slate/40 mb-8">
                            Items Secured — {order.items.length} {order.items.length === 1 ? "Pair" : "Pairs"}
                        </p>

                        <div className="space-y-px">
                            {order.items.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className="flex gap-6 p-6 bg-brand-surface/20 hover:bg-brand-surface/50 transition-colors group border border-transparent hover:border-brand-charcoal/5"
                                >
                                    {/* Product Image */}
                                    <div className="flex-shrink-0 w-24 h-24 bg-brand-surface overflow-hidden">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.product_name}
                                                className="w-full h-full object-contain mix-blend-multiply p-1"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-[8px] font-black uppercase text-brand-slate/20">
                                                    No Image
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-brand-slate/40 mb-1">
                                                    {item.brand_name}
                                                </p>
                                                <p className="text-sm font-black uppercase tracking-tight leading-tight">
                                                    {item.product_name}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-3">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest bg-brand-surface px-2 py-1 text-brand-slate/60">
                                                        {item.size_value}
                                                    </span>
                                                    <span className="text-[9px] font-bold uppercase tracking-widest bg-brand-surface px-2 py-1 text-brand-slate/60">
                                                        {item.color_name}
                                                    </span>
                                                    <span className="text-[9px] font-bold uppercase tracking-widest bg-brand-surface px-2 py-1 text-brand-slate/60">
                                                        Qty: {item.quantity}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-black tabular-nums">
                                                    {formatPrice(item.subtotal)}
                                                </p>
                                                {/* <p className="text-[9px] text-brand-slate/40 mt-1 tabular-nums">
                                                    {formatPrice(item.unit_price)} ea
                                                </p> */}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Re-shop CTA */}
                        <div className="mt-10 pt-6 border-t border-brand-surface">
                            <Link
                                href="/shop"
                                className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-brand-charcoal pb-0.5 hover:text-brand-slate hover:border-brand-slate transition-colors"
                            >
                                Browse The Archive →
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT: Summary Cards */}
                    <div className="mt-16 lg:mt-0 space-y-6">

                        {/* Order Summary */}
                        <div className="border border-brand-surface p-8 space-y-6">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/40">
                                Order Summary
                            </p>

                            <div className="space-y-4 text-[10px] font-bold uppercase tracking-wider">
                                <div className="flex justify-between text-brand-slate/60">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">{formatPrice(parseFloat(order.total_amount) - tax)}</span>
                                </div>
                                <div className="flex justify-between text-brand-slate/60">
                                    <span>Shipping</span>
                                    <span className="tabular-nums">Free</span>
                                </div>
                                <div className="flex justify-between text-brand-slate/60">
                                    <span>Tax (7%)</span>
                                    <span className="tabular-nums">{formatPrice(tax)}</span>
                                </div>
                                <div className="pt-4 border-t border-brand-surface flex justify-between font-black text-sm text-brand-charcoal">
                                    <span>Total</span>
                                    <span className="tabular-nums">{formatPrice(order.total_amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="border border-brand-surface p-8 space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/40">
                                Ship To
                            </p>
                            <div className="text-[10px] leading-loose font-bold uppercase tracking-wider text-brand-slate/70 space-y-0.5">
                                <p className="text-brand-charcoal font-black">{order.shipping_full_name}</p>
                                <p>{order.shipping_phone}</p>
                                <p>{order.shipping_address_line}</p>
                                <p>
                                    {order.shipping_city}
                                    {order.shipping_state_region ? `, ${order.shipping_state_region}` : ""}
                                    {order.shipping_postal_code ? ` ${order.shipping_postal_code}` : ""}
                                </p>
                                <p>{order.shipping_country}</p>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="border border-brand-surface p-8 space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/40">
                                Payment
                            </p>
                            <div className="space-y-3">
                                {order.payment_method && (
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                        <span className="text-brand-slate/60">Method</span>
                                        <span className="text-brand-charcoal">{order.payment_method}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-slate/60">Status</span>
                                    {order.payment_status_detail && (
                                        <StatusPill label={order.payment_status_detail} />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Back to orders */}
                        <Link
                            href="/orders"
                            className="flex items-center justify-center w-full border border-brand-charcoal py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-charcoal hover:text-brand-white transition-all duration-200"
                        >
                            ← Back to All Orders
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
