import React, { useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";

interface TrackItem {
    product_name: string;
    brand_name: string;
    color_name: string;
    size_value: string;
    quantity: number;
    image_url: string | null;
}

interface TrackResult {
    order_number: string;
    delivery_status: string;
    payment_status: string;
    payment_method: string | null;
    placed_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    shipping_city: string;
    shipping_country: string;
    items: TrackItem[];
}

interface Props {
    result: TrackResult | null;
}

const DELIVERY_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

function DeliveryTimeline({ current }: { current: string }) {
    const isCancelled = current === "Cancelled";
    const idx = DELIVERY_STEPS.indexOf(current);

    if (isCancelled) {
        return (
            <div className="flex items-center gap-3 py-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Order Cancelled</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-0">
            {DELIVERY_STEPS.map((step, i) => {
                const done   = i <= idx;
                const active = i === idx;
                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
                                active || done
                                    ? "border-brand-charcoal bg-brand-charcoal"
                                    : "border-brand-surface bg-brand-white"
                            }`} />
                            <span className={`mt-2 text-[7px] sm:text-[8px] font-black uppercase tracking-wider text-center ${
                                active ? "text-brand-charcoal" : done ? "text-brand-slate/60" : "text-brand-slate/20"
                            }`}>{step}</span>
                        </div>
                        {i < DELIVERY_STEPS.length - 1 && (
                            <div className={`flex-1 h-px mx-1 mb-5 transition-colors ${i < idx ? "bg-brand-charcoal" : "bg-brand-surface"}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function StatusPill({ label }: { label: string }) {
    const colorMap: Record<string, string> = {
        Confirmed:  "bg-emerald-50 text-emerald-700 border-emerald-200",
        Cancelled:  "bg-red-50 text-red-600 border-red-200",
        Processing: "bg-blue-50 text-blue-700 border-blue-200",
        Pending:    "bg-amber-50 text-amber-700 border-amber-200",
        Paid:       "bg-emerald-50 text-emerald-700 border-emerald-200",
        Refunded:   "bg-purple-50 text-purple-700 border-purple-200",
        Shipped:    "bg-blue-50 text-blue-700 border-blue-200",
        Delivered:  "bg-emerald-50 text-emerald-700 border-emerald-200",
        COD:        "bg-gray-50 text-gray-600 border-gray-200",
    };
    const cls = colorMap[label] ?? "bg-gray-50 text-gray-600 border-gray-200";
    return (
        <span className={`inline-block border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${cls}`}>
            {label}
        </span>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        timeZone: "Asia/Bangkok",
    });
}

export default function TrackIndex({ result }: Props) {
    const { errors }: any = usePage().props;
    const { data, setData, post, processing } = useForm({
        order_number: "",
        email: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("track.submit"));
    };

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title="Track Order — SNEAKER.DRP" />

            {/* ── NAV ── */}
            <nav className="fixed top-0 w-full z-50 border-b border-brand-surface bg-brand-white/95 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center py-6">
                    <div className="flex-1 hidden lg:flex gap-6 text-[10px] font-black uppercase tracking-widest">
                        <Link href="/shop" className="hover:text-brand-slate transition-colors">The Archive</Link>
                        <Link href="/track" className="border-b-2 border-brand-charcoal pb-0.5">Track Order</Link>
                    </div>
                    <h1 className="text-2xl font-black tracking-tightest uppercase flex-shrink-0">
                        <Link href="/">SNEAKER.DRP</Link>
                    </h1>
                    <div className="flex-1 hidden lg:flex justify-end gap-6 text-[10px] font-black uppercase tracking-widest">
                        <Link href="/orders" className="hover:text-brand-slate transition-colors">My Orders</Link>
                        <Link href="/shop" className="hover:text-brand-slate transition-colors">The Archive</Link>
                    </div>
                    {/* Mobile */}
                    <div className="flex lg:hidden ml-auto">
                        <Link href="/" className="text-[10px] font-black uppercase tracking-widest hover:text-brand-slate transition-colors">Home</Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-24 max-w-2xl mx-auto px-4 sm:px-6">

                {/* Header */}
                <div className="mb-12 border-b border-brand-surface pb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-slate/40 mb-3">Order Tracking</p>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tightest uppercase">Track Your Drop</h2>
                    <p className="mt-3 text-[11px] text-brand-slate/50 font-medium">
                        Enter your order number and the email used at checkout to see your order status.
                    </p>
                </div>

                {/* ── TRACKING FORM ── */}
                <form onSubmit={handleSubmit} className="space-y-5 mb-12">
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/50 mb-2">
                            Order Number
                        </label>
                        <input
                            type="text"
                            value={data.order_number}
                            onChange={e => setData("order_number", e.target.value)}
                            placeholder="e.g. ORD-20240101-XXXX"
                            className="w-full border border-brand-surface px-4 py-3.5 text-sm font-medium outline-none focus:border-brand-charcoal transition-colors bg-white placeholder:text-brand-slate/30 uppercase"
                        />
                        {errors.order_number && (
                            <p className="mt-2 text-[9px] font-bold text-red-500 uppercase tracking-wider">{errors.order_number}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/50 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData("email", e.target.value)}
                            placeholder="email used at checkout"
                            className="w-full border border-brand-surface px-4 py-3.5 text-sm font-medium outline-none focus:border-brand-charcoal transition-colors bg-white placeholder:text-brand-slate/30"
                        />
                        {errors.email && (
                            <p className="mt-2 text-[9px] font-bold text-red-500 uppercase tracking-wider">{errors.email}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !data.order_number || !data.email}
                        className="w-full py-4 bg-brand-charcoal text-brand-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-slate transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {processing ? "Tracking..." : "Track Order →"}
                    </button>
                </form>

                {/* ── RESULT ── */}
                {result && (
                    <div className="border border-brand-surface">

                        {/* Result header */}
                        <div className="px-8 py-6 border-b border-brand-surface flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/40 mb-1">Order Found</p>
                                <h3 className="text-xl font-black uppercase tracking-tight">{result.order_number}</h3>
                                {result.placed_at && (
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-brand-slate/40 mt-1">
                                        Placed {formatDate(result.placed_at)}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                                <StatusPill label={result.delivery_status} />
                                <StatusPill label={result.payment_status} />
                            </div>
                        </div>

                        {/* Delivery timeline */}
                        <div className="px-8 py-8 border-b border-brand-surface bg-brand-surface/20">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/40 mb-6">Delivery Progress</p>
                            <DeliveryTimeline current={result.delivery_status} />

                            {result.delivery_status === "Cancelled" && result.cancellation_reason && (
                                <p className="mt-4 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                                    Reason: {result.cancellation_reason}
                                </p>
                            )}
                        </div>

                        {/* Items */}
                        <div className="px-8 py-6 border-b border-brand-surface">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/40 mb-5">
                                Items — {result.items.length} {result.items.length === 1 ? "Pair" : "Pairs"}
                            </p>
                            <div className="space-y-4">
                                {result.items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-brand-surface shrink-0 overflow-hidden">
                                            {item.image_url
                                                ? <img src={item.image_url} alt={item.product_name} className="w-full h-full object-contain mix-blend-multiply p-1" />
                                                : <div className="w-full h-full flex items-center justify-center"><span className="text-[7px] text-brand-slate/20 font-black uppercase">No img</span></div>
                                            }
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-brand-slate/40">{item.brand_name}</p>
                                            <p className="text-xs font-black uppercase tracking-tight truncate">{item.product_name}</p>
                                            <div className="flex gap-2 mt-1 flex-wrap">
                                                {[item.size_value, item.color_name, `Qty: ${item.quantity}`].map(tag => (
                                                    <span key={tag} className="text-[8px] font-bold uppercase tracking-widest bg-brand-surface px-1.5 py-0.5 text-brand-slate/60">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Destination */}
                        <div className="px-8 py-5 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/40 mb-1">Shipping To</p>
                                <p className="text-[11px] font-bold uppercase tracking-wide">
                                    {result.shipping_city}, {result.shipping_country}
                                </p>
                            </div>
                            {result.payment_method && (
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/40 mb-1">Payment</p>
                                    <p className="text-[11px] font-bold uppercase tracking-wide">{result.payment_method}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer link */}
                <div className="mt-12 pt-8 border-t border-brand-surface text-center space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/30">Have an account?</p>
                    <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-brand-charcoal pb-0.5 hover:text-brand-slate hover:border-brand-slate transition-colors">
                        Sign in for full order history →
                    </Link>
                </div>
            </main>
        </div>
    );
}
