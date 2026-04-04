import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import NotificationBell from "@/Components/NotificationBell";

interface OrderItem {
    id: number;
    product_name: string;
    brand_name: string;
    color_name: string;
    size_value: string;
    unit_price: string;
    quantity: number;
    subtotal: string;
    image_url: string | null;
}

interface ReturnRequest {
    id: number;
    status: string;
    refund_method: string;
    refund_amount: string | null;
    admin_note: string | null;
    requested_at: string;
    item_ids: number[];
}

interface Order {
    id: number;
    order_number: string;
    total_amount: string;
    shipping_fee: string | null;
    order_status: string;
    payment_status: string;
    delivery_status: string;
    placed_at: string;
    delivered_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    cancellation_note: string | null;
    shipping_full_name: string;
    shipping_phone: string;
    shipping_address_line: string;
    shipping_city: string;
    shipping_state_region: string | null;
    shipping_postal_code: string | null;
    shipping_country: string;
    payment_method: string | null;
    cardholder_name: string | null;
    card_last4: string | null;
    payment_status_detail: string | null;
    return_request: ReturnRequest | null;
    items: OrderItem[];
}

interface Props { order: Order }

const REASONS = [
    "Ordered by mistake",
    "Changed my mind",
    "Ordered the wrong size / color",
    "Want to change shipping address",
    "Ordered duplicate by mistake",
    "Other",
];

function formatDate(iso: string) {
    // Parse with timeZone:"UTC" so the displayed date matches the stored date.
    // Without this, e.g. 2026-03-14 21:51:30 UTC shows as Mar 15 in UTC+7.
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatPrice(val: string | number) {
    return `$${parseFloat(String(val)).toFixed(2)}`;
}

function StatusPill({ label }: { label: string }) {
    const map: Record<string, string> = {
        Confirmed:         "bg-emerald-50 text-emerald-700 border-emerald-200",
        Cancelled:         "bg-red-50 text-red-600 border-red-200",
        Refunded:          "bg-purple-50 text-purple-700 border-purple-200",
        Processing:        "bg-blue-50 text-blue-700 border-blue-200",
        Pending:           "bg-amber-50 text-amber-700 border-amber-200",
        Shipped:           "bg-blue-50 text-blue-700 border-blue-200",
        Delivered:         "bg-emerald-50 text-emerald-700 border-emerald-200",
        COD:               "bg-slate-50 text-slate-600 border-slate-200",
        "Return Requested":"bg-orange-50 text-orange-700 border-orange-200",
        "Return Approved": "bg-emerald-50 text-emerald-700 border-emerald-200",
        Returned:          "bg-purple-50 text-purple-700 border-purple-200",
    };
    return (
        <span className={`inline-block border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${map[label] ?? "bg-brand-surface text-brand-slate border-brand-surface"}`}>
            {label}
        </span>
    );
}

const DELIVERY_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

function DeliveryTimeline({ current }: { current: string }) {
    const isCancelled = current === "Cancelled";
    const idx = DELIVERY_STEPS.indexOf(current);

    if (isCancelled) {
        return (
            <div className="flex items-center gap-3 py-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-500 shrink-0" />
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
                                active || done ? "border-brand-charcoal bg-brand-charcoal" : "border-brand-surface bg-brand-white"
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

// ── Cancellation Modal ────────────────────────────────────────────────────────
function CancelModal({ order, onClose }: { order: Order; onClose: () => void }) {
    const [reason,      setReason]      = useState("");
    const [note,        setNote]        = useState("");
    const [submitting,  setSubmitting]  = useState(false);
    const { errors }: any = usePage().props;

    const isCard = order.payment_method && order.payment_method.toLowerCase() !== "cod";

    const handleSubmit = () => {
        if (!reason) return;
        setSubmitting(true);
        router.post(route("orders.cancel", order.id), {
            cancellation_reason: reason,
            cancellation_note:   note,
        }, {
            preserveScroll: true,
            onSuccess: () => { setSubmitting(false); onClose(); },
            onError:   () => setSubmitting(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">

                {/* Header */}
                <div className="border-b border-brand-surface px-8 py-6 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-brand-slate/30 mb-1">Cancel Order</p>
                        <h3 className="text-xl font-black uppercase tracking-tight">{order.order_number}</h3>
                    </div>
                    <button onClick={onClose} className="text-brand-slate/30 hover:text-brand-charcoal transition-colors mt-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-8 py-6 space-y-6">

                    {/* Order summary */}
                    <div className="bg-brand-surface/40 p-5 space-y-3">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/40">Order Summary</p>
                        <div className="space-y-2">
                            {order.items.map(item => (
                                <div key={item.id} className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
                                    <span className="text-brand-slate/60 truncate pr-4">
                                        {item.brand_name} {item.product_name} — {item.size_value} / {item.color_name} × {item.quantity}
                                    </span>
                                    <span className="shrink-0 tabular-nums">{formatPrice(item.subtotal)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-3 border-t border-brand-surface flex justify-between text-sm font-black uppercase">
                            <span>Total</span>
                            <span className="tabular-nums">{formatPrice(order.total_amount)}</span>
                        </div>
                    </div>

                    {/* Reason dropdown */}
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/40 mb-3">
                            Reason for Cancellation <span className="text-red-500">*</span>
                        </p>
                        <div className="space-y-2">
                            {REASONS.map(r => (
                                <label key={r} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                        reason === r ? "border-brand-charcoal bg-brand-charcoal" : "border-brand-surface group-hover:border-brand-slate/40"
                                    }`}>
                                        {reason === r && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <input type="radio" className="sr-only" value={r} checked={reason === r} onChange={() => setReason(r)} />
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-brand-slate/70">{r}</span>
                                </label>
                            ))}
                        </div>
                        {errors?.cancellation_reason && (
                            <p className="mt-2 text-[9px] font-bold text-red-500">{errors.cancellation_reason}</p>
                        )}
                    </div>

                    {/* Other free-text */}
                    {reason === "Other" && (
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/40 mb-2">
                                Please explain <span className="text-red-500">*</span>
                            </p>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Tell us more about why you're cancelling..."
                                rows={3}
                                maxLength={500}
                                className="w-full border border-brand-surface px-4 py-3 text-xs font-medium outline-none focus:border-brand-charcoal transition-colors bg-white resize-none"
                            />
                            <p className="text-[8px] text-brand-slate/30 text-right mt-1">{note.length}/500</p>
                            {errors?.cancellation_note && (
                                <p className="text-[9px] font-bold text-red-500 mt-1">{errors.cancellation_note}</p>
                            )}
                        </div>
                    )}

                    {/* Refund / COD notice */}
                    {isCard ? (
                        <div className="border border-purple-200 bg-purple-50 p-5 space-y-1">
                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-purple-600">Refund Information</p>
                            <p className="text-[11px] font-bold text-purple-800 leading-relaxed">
                                A full refund of <strong>{formatPrice(order.total_amount)}</strong> will be automatically processed to the card ending in <strong>{order.card_last4 ?? "••••"}</strong>.
                            </p>
                            <p className="text-[10px] text-purple-600 font-medium">
                                Please allow 5–10 business days for the refund to appear on your statement.
                            </p>
                        </div>
                    ) : (
                        <div className="border border-brand-surface bg-brand-surface/30 p-5">
                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/40 mb-1">Payment Notice</p>
                            <p className="text-[11px] font-bold text-brand-slate/60 leading-relaxed">
                                This order was placed with Cash on Delivery. No payment has been collected, so no refund is needed.
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {errors?.cancel && (
                        <div className="border border-red-200 bg-red-50 px-5 py-4">
                            <p className="text-[10px] font-black uppercase tracking-wider text-red-600">{errors.cancel}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={!reason || (reason === "Other" && !note.trim()) || submitting}
                            className="flex-1 py-4 bg-red-600 text-white text-[9px] font-black uppercase tracking-[0.3em] hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Cancelling..." : "Confirm Cancellation"}
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 border border-brand-charcoal text-[9px] font-black uppercase tracking-[0.3em] hover:bg-brand-charcoal hover:text-white transition-colors"
                        >
                            Keep Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const RETURN_REASONS = [
    "Wrong size",
    "Wrong color / item",
    "Defective / damaged",
    "Not as described",
    "Changed my mind",
    "Other",
];

const REFUND_METHODS_CARD = ["Original Card", "Bank Transfer", "Store Credit"];
const REFUND_METHODS_COD  = ["Bank Transfer", "Store Credit"];

interface ReturnItemForm {
    order_item_id: number;
    quantity: number;
    reason: string;
    photo: File | null;
}

// ── Return Modal ──────────────────────────────────────────────────────────────
function ReturnModal({ order, onClose }: { order: Order; onClose: () => void }) {
    const { errors }: any = usePage().props;
    const isCard = order.payment_method && order.payment_method.toLowerCase() !== "cod";
    const refundMethods = isCard ? REFUND_METHODS_CARD : REFUND_METHODS_COD;

    const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>({});
    const [itemForms,     setItemForms]     = useState<Record<number, ReturnItemForm>>({});
    const [refundMethod,  setRefundMethod]  = useState(refundMethods[0]);
    const [accountDetails, setAccountDetails] = useState("");
    const [submitting,    setSubmitting]    = useState(false);

    const toggleItem = (itemId: number) => {
        setSelectedItems(prev => {
            const next = { ...prev, [itemId]: !prev[itemId] };
            if (next[itemId] && !itemForms[itemId]) {
                const orderItem = order.items.find(i => i.id === itemId)!;
                setItemForms(f => ({ ...f, [itemId]: { order_item_id: itemId, quantity: orderItem.quantity, reason: "", photo: null } }));
            }
            return next;
        });
    };

    const updateForm = (itemId: number, field: keyof ReturnItemForm, value: any) => {
        setItemForms(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
    };

    const selectedIds = Object.keys(selectedItems).filter(k => selectedItems[+k]).map(Number);
    const allValid = selectedIds.length > 0 && selectedIds.every(id => itemForms[id]?.reason);

    const handleSubmit = () => {
        if (!allValid) return;
        setSubmitting(true);

        const data = new FormData();
        data.append("refund_method", refundMethod);
        if (accountDetails) data.append("refund_account_details", accountDetails);

        selectedIds.forEach((id, i) => {
            const f = itemForms[id];
            data.append(`items[${i}][order_item_id]`, String(f.order_item_id));
            data.append(`items[${i}][quantity]`,      String(f.quantity));
            data.append(`items[${i}][reason]`,        f.reason);
            if (f.photo) data.append(`items[${i}][photo]`, f.photo);
        });

        router.post(route("orders.return", order.id), data, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { setSubmitting(false); onClose(); },
            onError:   () => setSubmitting(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">

                {/* Header */}
                <div className="border-b border-brand-surface px-8 py-6 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-brand-slate/30 mb-1">Request Return</p>
                        <h3 className="text-xl font-black uppercase tracking-tight">{order.order_number}</h3>
                    </div>
                    <button onClick={onClose} className="text-brand-slate/30 hover:text-brand-charcoal transition-colors mt-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="px-8 py-6 space-y-8">

                    {/* Step 1: Select Items */}
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/40 mb-4">
                            Select Items to Return <span className="text-red-500">*</span>
                        </p>
                        <div className="space-y-3">
                            {order.items.map(item => {
                                const checked = !!selectedItems[item.id];
                                const form    = itemForms[item.id];
                                return (
                                    <div key={item.id} className={`border transition-colors ${checked ? "border-brand-charcoal" : "border-brand-surface"}`}>
                                        {/* Item row */}
                                        <label className="flex items-center gap-4 p-4 cursor-pointer">
                                            <div className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "border-brand-charcoal bg-brand-charcoal" : "border-brand-surface"}`}>
                                                {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                                            </div>
                                            <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleItem(item.id)} />
                                            {item.image_url && (
                                                <img src={item.image_url} alt={item.product_name} className="w-12 h-12 object-contain mix-blend-multiply" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-brand-slate/40">{item.brand_name}</p>
                                                <p className="text-xs font-black uppercase tracking-tight">{item.product_name}</p>
                                                <div className="flex gap-2 mt-1">
                                                    {[item.size_value, item.color_name].map(t => (
                                                        <span key={t} className="text-[8px] font-bold uppercase tracking-widest bg-brand-surface px-1.5 py-0.5 text-brand-slate/60">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs font-black tabular-nums shrink-0">{formatPrice(item.subtotal)}</p>
                                        </label>

                                        {/* Per-item details (only when selected) */}
                                        {checked && form && (
                                            <div className="border-t border-brand-surface px-4 pb-4 pt-3 space-y-3 bg-brand-surface/20">
                                                {/* Quantity */}
                                                <div className="flex items-center gap-4">
                                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-slate/40 w-24 shrink-0">Qty to return</p>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => updateForm(item.id, "quantity", Math.max(1, form.quantity - 1))} className="w-7 h-7 border border-brand-surface flex items-center justify-center text-brand-slate/60 hover:border-brand-charcoal hover:text-brand-charcoal transition-colors text-sm font-bold">−</button>
                                                        <span className="text-sm font-black w-6 text-center">{form.quantity}</span>
                                                        <button onClick={() => updateForm(item.id, "quantity", Math.min(item.quantity, form.quantity + 1))} className="w-7 h-7 border border-brand-surface flex items-center justify-center text-brand-slate/60 hover:border-brand-charcoal hover:text-brand-charcoal transition-colors text-sm font-bold">+</button>
                                                        <span className="text-[8px] font-bold text-brand-slate/30 uppercase tracking-widest">of {item.quantity}</span>
                                                    </div>
                                                </div>

                                                {/* Reason */}
                                                <div>
                                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-slate/40 mb-2">
                                                        Reason <span className="text-red-500">*</span>
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        {RETURN_REASONS.map(r => (
                                                            <label key={r} className="flex items-center gap-2 cursor-pointer group">
                                                                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${form.reason === r ? "border-brand-charcoal bg-brand-charcoal" : "border-brand-surface group-hover:border-brand-slate/40"}`}>
                                                                    {form.reason === r && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                                </div>
                                                                <input type="radio" className="sr-only" value={r} checked={form.reason === r} onChange={() => updateForm(item.id, "reason", r)} />
                                                                <span className="text-[9px] font-bold uppercase tracking-wide text-brand-slate/70">{r}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Photo (optional) */}
                                                <div>
                                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-slate/40 mb-2">Photo proof (optional)</p>
                                                    {form.photo ? (
                                                        <div className="flex items-center gap-3">
                                                            <img src={URL.createObjectURL(form.photo)} alt="proof" className="w-16 h-16 object-cover border border-brand-surface" />
                                                            <button onClick={() => updateForm(item.id, "photo", null)} className="text-[9px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700">Remove</button>
                                                        </div>
                                                    ) : (
                                                        <label className="inline-flex items-center gap-2 border border-dashed border-brand-surface px-4 py-2.5 cursor-pointer hover:border-brand-charcoal transition-colors">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                                            <span className="text-[9px] font-bold uppercase tracking-widest">Upload photo</span>
                                                            <input type="file" className="sr-only" accept="image/*" onChange={e => updateForm(item.id, "photo", e.target.files?.[0] ?? null)} />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Refund Method */}
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/40 mb-3">
                            Refund Method <span className="text-red-500">*</span>
                        </p>
                        <div className="space-y-2">
                            {refundMethods.map(m => (
                                <label key={m} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${refundMethod === m ? "border-brand-charcoal bg-brand-charcoal" : "border-brand-surface group-hover:border-brand-slate/40"}`}>
                                        {refundMethod === m && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <input type="radio" className="sr-only" value={m} checked={refundMethod === m} onChange={() => setRefundMethod(m)} />
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-brand-slate/70">{m}</span>
                                    {m === "Original Card" && order.card_last4 && (
                                        <span className="text-[9px] font-mono text-brand-slate/40">•••• {order.card_last4}</span>
                                    )}
                                </label>
                            ))}
                        </div>

                        {refundMethod === "Bank Transfer" && (
                            <div className="mt-4">
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-slate/40 mb-2">
                                    Bank account details <span className="text-red-500">*</span>
                                </p>
                                <textarea
                                    value={accountDetails}
                                    onChange={e => setAccountDetails(e.target.value)}
                                    placeholder="Bank name, account number, account holder name..."
                                    rows={3}
                                    maxLength={500}
                                    className="w-full border border-brand-surface px-4 py-3 text-xs font-medium outline-none focus:border-brand-charcoal transition-colors bg-white resize-none"
                                />
                            </div>
                        )}
                    </div>

                    {/* Return policy note */}
                    <div className="border border-brand-surface bg-brand-surface/30 p-5">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/40 mb-1">Return Policy</p>
                        <p className="text-[11px] font-bold text-brand-slate/60 leading-relaxed">
                            Returns are accepted within 7 days of delivery. Items must be unused and in original condition. Refunds are processed within 5–10 business days after approval.
                        </p>
                    </div>

                    {/* Error */}
                    {errors?.return && (
                        <div className="border border-red-200 bg-red-50 px-5 py-4">
                            <p className="text-[10px] font-black uppercase tracking-wider text-red-600">{errors.return}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={!allValid || (refundMethod === "Bank Transfer" && !accountDetails.trim()) || submitting}
                            className="flex-1 py-4 bg-brand-charcoal text-white text-[9px] font-black uppercase tracking-[0.3em] hover:bg-brand-slate transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Submitting..." : "Submit Return Request"}
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 border border-brand-charcoal text-[9px] font-black uppercase tracking-[0.3em] hover:bg-brand-charcoal hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrdersShow({ order }: Props) {
    const { auth, cart, flash }: any = usePage().props;
    const cartCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showMobileMenu,  setShowMobileMenu]  = useState(false);

    const isCancelled = order.order_status === "Cancelled";
    const isCard      = order.payment_method && order.payment_method.toLowerCase() !== "cod";

    // Within 24 hours and still pending
    const placedAt       = order.placed_at ? new Date(order.placed_at) : null;
    const hoursElapsed   = placedAt ? (Date.now() - placedAt.getTime()) / 3600000 : 999;
    const canCancel      = !isCancelled && order.delivery_status === "Pending" && hoursElapsed <= 24;

    // Return eligibility: delivered, delivered_at within 7 days, no active return
    const deliveredAt    = order.delivered_at ? new Date(order.delivered_at) : null;
    const daysDelivered  = deliveredAt ? (Date.now() - deliveredAt.getTime()) / 86400000 : 999;
    const hasActiveReturn = order.return_request && ["Pending", "Approved"].includes(order.return_request.status);
    const canReturn      = order.delivery_status === "Delivered" && !!deliveredAt && daysDelivered <= 7 && !hasActiveReturn;

    const tax = parseFloat(order.total_amount) * 0.07;

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title={`${order.order_number} — SNEAKER.DRP`} />

            {/* ── MOBILE NAV SIDEBAR ── */}
            {showMobileMenu && (
                <div className="fixed inset-0 z-[60]">
                    <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
                    <div className="absolute top-0 right-0 h-full w-72 bg-white flex flex-col">
                        <div className="flex items-center justify-between px-6 py-6 border-b border-brand-surface">
                            <span className="text-xs font-black uppercase tracking-widest">Menu</span>
                            <button onClick={() => setShowMobileMenu(false)} className="p-1 hover:opacity-50 transition-opacity">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <nav className="flex flex-col flex-1 px-6 py-8 overflow-y-auto">
                            {[
                                { label: "The Archive", href: "/shop" },
                                { label: "About Us", href: route("about") },
                                { label: "My Orders", href: "/orders" },
                            ].map(item => (
                                <Link key={item.label} href={item.href} onClick={() => setShowMobileMenu(false)}
                                    className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors text-brand-charcoal">
                                    {item.label}
                                </Link>
                            ))}
                            {auth?.user ? (
                                <>
                                    <Link href="/profile" onClick={() => setShowMobileMenu(false)}
                                        className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors">
                                        {auth.user.name}
                                    </Link>
                                    <Link href="/logout" method="post" as="button" onClick={() => setShowMobileMenu(false)}
                                        className="text-left text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors cursor-pointer">
                                        Log Out
                                    </Link>
                                </>
                            ) : (
                                <Link href="/login" onClick={() => setShowMobileMenu(false)}
                                    className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors">
                                    Account
                                </Link>
                            )}
                        </nav>
                        <div className="px-6 py-6 border-t border-brand-surface">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/30">SNEAKER.DRP © 2026</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── NAV ── */}
            <nav className="fixed top-0 w-full z-40 border-b border-brand-surface bg-brand-white/95 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center py-6">
                    {/* Desktop left */}
                    <div className="flex-1 hidden lg:flex gap-6 text-[10px] font-black uppercase tracking-widest">
                        <Link href="/shop" className="hover:text-brand-slate transition-colors">The Archive</Link>
                        <Link href={route("about")} className="hover:text-brand-slate transition-colors">About Us</Link>
                        <Link href="/orders" className="hover:text-brand-slate transition-colors">My Orders</Link>
                    </div>
                    <h1 className="text-2xl font-black tracking-tightest uppercase flex-shrink-0">
                        <Link href="/">SNEAKER.DRP</Link>
                    </h1>
                    {/* Desktop right */}
                    <div className="flex-1 hidden lg:flex justify-end items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                        {auth?.user ? (
                            <>
                                <Link href="/profile" className="hover:text-brand-slate transition-colors">{auth.user.name}</Link>
                                <Link href="/logout" method="post" as="button" className="hover:text-brand-slate transition-colors uppercase cursor-pointer">Log Out</Link>
                                <NotificationBell userId={auth.user.id} />
                            </>
                        ) : (
                            <Link href="/login" className="hover:text-brand-slate transition-colors">Account</Link>
                        )}
                        <Link href="/shop" className="flex items-center gap-2 group">
                            <span>Vault</span>
                            <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px] group-hover:bg-brand-slate transition-colors">{cartCount}</span>
                        </Link>
                    </div>
                    {/* Mobile right */}
                    <div className="flex lg:hidden items-center gap-4 ml-auto">
                        {auth?.user && <NotificationBell userId={auth.user.id} />}
                        <Link href="/shop" className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                            <span>Vault</span>
                            <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px]">{cartCount}</span>
                        </Link>
                        <button onClick={() => setShowMobileMenu(true)} className="p-1 hover:opacity-50 transition-opacity">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb */}
                <div className="mb-10 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/40">
                    <Link href="/orders" className="hover:text-brand-charcoal transition-colors">Orders</Link>
                    <span>/</span>
                    <span className="text-brand-charcoal">{order.order_number}</span>
                </div>

                {/* ── Success flash ── */}
                {flash?.success && (
                    <div className="mb-8 border border-emerald-200 bg-emerald-50 px-6 py-4 flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">{flash.success}</p>
                    </div>
                )}

                {/* ── Cancelled banner ── */}
                {isCancelled && (
                    <div className="mb-8 border border-red-200 bg-red-50 px-6 py-5 space-y-2">
                        <div className="flex items-center gap-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">This Order Has Been Cancelled</p>
                        </div>
                        {order.cancellation_reason && (
                            <p className="text-[10px] font-bold text-red-500 pl-7 uppercase tracking-wide">
                                Reason: {order.cancellation_reason}
                                {order.cancellation_note ? ` — ${order.cancellation_note}` : ""}
                            </p>
                        )}
                        {isCard && (
                            <p className="text-[10px] font-bold text-purple-600 pl-7">
                                A refund of {formatPrice(order.total_amount)} has been initiated to the card ending in {order.card_last4 ?? "••••"}. Allow 5–10 business days.
                            </p>
                        )}
                    </div>
                )}

                {/* ── Return status banner ── */}
                {order.return_request && (
                    <div className={`mb-8 px-6 py-5 space-y-2 border ${
                        order.return_request.status === "Rejected"  ? "border-red-200 bg-red-50" :
                        order.return_request.status === "Refunded"  ? "border-purple-200 bg-purple-50" :
                        order.return_request.status === "Approved"  ? "border-emerald-200 bg-emerald-50" :
                        "border-orange-200 bg-orange-50"
                    }`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                            order.return_request.status === "Rejected"  ? "text-red-600" :
                            order.return_request.status === "Refunded"  ? "text-purple-700" :
                            order.return_request.status === "Approved"  ? "text-emerald-700" :
                            "text-orange-700"
                        }`}>
                            Return Request — {order.return_request.status}
                        </p>
                        {order.return_request.status === "Pending" && (
                            <p className="text-[10px] font-bold text-orange-600 leading-relaxed">
                                Your return request is under review. We'll notify you within 1–2 business days.
                            </p>
                        )}
                        {order.return_request.status === "Approved" && (
                            <p className="text-[10px] font-bold text-emerald-700 leading-relaxed">
                                Your return has been approved. A refund of <strong>{order.return_request.refund_amount ? `$${parseFloat(order.return_request.refund_amount).toFixed(2)}` : "—"}</strong> via <strong>{order.return_request.refund_method}</strong> is being processed.
                            </p>
                        )}
                        {order.return_request.status === "Rejected" && (
                            <p className="text-[10px] font-bold text-red-500 leading-relaxed">
                                {order.return_request.admin_note ?? "Your return request was not approved."}
                            </p>
                        )}
                        {order.return_request.status === "Refunded" && (
                            <p className="text-[10px] font-bold text-purple-700 leading-relaxed">
                                Your refund of <strong>{order.return_request.refund_amount ? `$${parseFloat(order.return_request.refund_amount).toFixed(2)}` : "—"}</strong> via <strong>{order.return_request.refund_method}</strong> has been processed. Allow 5–10 business days.
                            </p>
                        )}
                    </div>
                )}

                {/* ── PAGE HEADER ── */}
                <div className="mb-16 border-b border-brand-surface pb-10">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-slate/40 mb-2">Drop Receipt</p>
                            <h2 className="text-2xl sm:text-4xl font-black tracking-tightest uppercase break-all">{order.order_number}</h2>
                            {order.placed_at && (
                                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-brand-slate/40">
                                    Placed {formatDate(order.placed_at)}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <StatusPill label={order.order_status} />
                            <StatusPill label={order.payment_status} />
                            <StatusPill label={order.delivery_status} />
                            <button
                                onClick={async () => {
                                    const url = route("orders.invoice", order.id);
                                    if (Capacitor.isNativePlatform()) {
                                        Browser.open({ url });
                                    } else {
                                        const res = await fetch(url, { credentials: "same-origin" });
                                        const blob = await res.blob();
                                        const blobUrl = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = blobUrl;
                                        a.download = `invoice-${order.order_number}.pdf`;
                                        a.click();
                                        URL.revokeObjectURL(blobUrl);
                                    }
                                }}
                                className="inline-flex items-center gap-2 border border-brand-charcoal px-4 py-2 text-[8px] font-black uppercase tracking-[0.3em] hover:bg-brand-charcoal hover:text-white transition-colors"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Invoice
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── DELIVERY TIMELINE ── */}
                <section className="mb-20 p-8 bg-brand-surface/30 border border-brand-surface">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/40 mb-8">Delivery Progress</p>
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
                            {order.items.map(item => (
                                <div key={item.id} className="flex gap-6 p-6 bg-brand-surface/20 border border-transparent">
                                    <div className="flex-shrink-0 w-24 h-24 bg-brand-surface overflow-hidden">
                                        {item.image_url
                                            ? <img src={item.image_url} alt={item.product_name} className="w-full h-full object-contain mix-blend-multiply p-1" />
                                            : <div className="w-full h-full flex items-center justify-center"><span className="text-[8px] font-black uppercase text-brand-slate/20">No Image</span></div>
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-brand-slate/40 mb-1">{item.brand_name}</p>
                                                <p className="text-sm font-black uppercase tracking-tight leading-tight">{item.product_name}</p>
                                                <div className="mt-3 flex flex-wrap gap-3">
                                                    {[item.size_value, item.color_name, `Qty: ${item.quantity}`].map(tag => (
                                                        <span key={tag} className="text-[9px] font-bold uppercase tracking-widest bg-brand-surface px-2 py-1 text-brand-slate/60">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm font-black tabular-nums shrink-0">{formatPrice(item.subtotal)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 pt-6 border-t border-brand-surface">
                            <Link href="/shop" className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-brand-charcoal pb-0.5 hover:text-brand-slate hover:border-brand-slate transition-colors">
                                Browse The Archive →
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT: Cards */}
                    <div className="mt-16 lg:mt-0 space-y-6">

                        {/* Order Summary */}
                        <div className="border border-brand-surface p-8 space-y-6">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/40">Order Summary</p>
                            <div className="space-y-4 text-[10px] font-bold uppercase tracking-wider">
                                <div className="flex justify-between text-brand-slate/60">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">{formatPrice(parseFloat(order.total_amount) - tax)}</span>
                                </div>
                                <div className="flex justify-between text-brand-slate/60">
                                    <span>Shipping</span>
                                    <span className="tabular-nums">
                                        {order.shipping_fee && parseFloat(order.shipping_fee) > 0
                                            ? formatPrice(order.shipping_fee)
                                            : 'Free'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-brand-slate/60">
                                    <span>Tax (7%)</span>
                                    <span className="tabular-nums">{formatPrice(tax)}</span>
                                </div>
                                <div className="pt-4 border-t border-brand-surface flex justify-between font-black text-sm">
                                    <span>Total</span>
                                    <span className="tabular-nums">{formatPrice(order.total_amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="border border-brand-surface p-8 space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/40">Ship To</p>
                            <div className="text-[10px] leading-loose font-bold uppercase tracking-wider text-brand-slate/70 space-y-0.5">
                                <p className="text-brand-charcoal font-black">{order.shipping_full_name}</p>
                                <p>{order.shipping_phone}</p>
                                <p>{order.shipping_address_line}</p>
                                <p>{order.shipping_city}{order.shipping_state_region ? `, ${order.shipping_state_region}` : ""}{order.shipping_postal_code ? ` ${order.shipping_postal_code}` : ""}</p>
                                <p>{order.shipping_country}</p>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="border border-brand-surface p-8 space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/40">Payment</p>
                            <div className="space-y-3">
                                {order.payment_method && (
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                        <span className="text-brand-slate/60">Method</span>
                                        <span>{order.payment_method}</span>
                                    </div>
                                )}
                                {order.card_last4 && (
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                        <span className="text-brand-slate/60">Card</span>
                                        <span className="font-mono">•••• {order.card_last4}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-slate/60">Status</span>
                                    <StatusPill label={order.payment_status} />
                                </div>
                            </div>
                        </div>

                        {/* Cancel button */}
                        {canCancel && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="w-full py-4 border border-red-300 text-red-600 text-[9px] font-black uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200"
                            >
                                Cancel This Order
                            </button>
                        )}

                        {/* Return button */}
                        {canReturn && (
                            <button
                                onClick={() => setShowReturnModal(true)}
                                className="w-full py-4 border border-brand-charcoal text-brand-charcoal text-[9px] font-black uppercase tracking-[0.3em] hover:bg-brand-charcoal hover:text-white transition-all duration-200"
                            >
                                Request Return
                            </button>
                        )}

                        {/* Return window info (delivered but window closed) */}
                        {order.delivery_status === "Delivered" && !canReturn && !hasActiveReturn && order.return_request?.status !== "Refunded" && (
                            <div className="border border-brand-surface px-5 py-4 bg-brand-surface/30">
                                <p className="text-[9px] font-black uppercase tracking-widest text-brand-slate/40">Returns Closed</p>
                                <p className="text-[10px] font-bold text-brand-slate/50 mt-1">The 7-day return window has passed.</p>
                            </div>
                        )}

                        <Link href="/orders" className="flex items-center justify-center w-full border border-brand-charcoal py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-charcoal hover:text-brand-white transition-all duration-200">
                            ← Back to All Orders
                        </Link>
                    </div>
                </div>
            </main>

            {/* Cancellation Modal */}
            {showCancelModal && (
                <CancelModal order={order} onClose={() => setShowCancelModal(false)} />
            )}

            {/* Return Modal */}
            {showReturnModal && (
                <ReturnModal order={order} onClose={() => setShowReturnModal(false)} />
            )}
        </div>
    );
}
