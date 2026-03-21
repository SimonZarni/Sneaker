import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";

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

interface Order {
    id: number;
    order_number: string;
    total_amount: string;
    shipping_fee: string | null;
    order_status: string;
    payment_status: string;
    delivery_status: string;
    placed_at: string;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    cancellation_note: string | null;
    customer_name: string | null;
    customer_email: string | null;
    shipping_full_name: string;
    shipping_phone: string;
    shipping_address_line: string;
    shipping_city: string;
    shipping_state_region: string | null;
    shipping_postal_code: string | null;
    shipping_country: string;
    payment_method: string | null;
    payment_status_detail: string | null;
    cardholder_name: string | null;
    card_last4: string | null;
    items: OrderItem[];
}

interface Props { order: Order; deliverySteps: string[]; admin: { name: string } }

const REASONS = [
    "Fraudulent order detected",
    "Item out of stock / fulfillment failure",
    "Customer requested cancellation",
    "Duplicate order",
    "Shipping address undeliverable",
    "Other",
];

function fmtDate(iso: string) {
    // Parse with timeZone:"UTC" so the displayed date matches the stored date.
    // Without this, e.g. 2026-03-14 21:51:30 UTC shows as Mar 15 in UTC+7.
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

const D_BG:  Record<string,string> = { Pending:"#fffbeb", Processing:"#eff6ff", Shipped:"#f5f3ff", Delivered:"#ecfdf5", Cancelled:"#fef2f2" };
const D_TXT: Record<string,string> = { Pending:"#b45309", Processing:"#1d4ed8", Shipped:"#6d28d9", Delivered:"#065f46", Cancelled:"#dc2626" };
const D_BDR: Record<string,string> = { Pending:"#fde68a", Processing:"#bfdbfe", Shipped:"#ddd6fe", Delivered:"#a7f3d0", Cancelled:"#fecaca" };
const P_BG:  Record<string,string> = { Confirmed:"#ecfdf5", Pending:"#fffbeb", COD:"#f8fafc", Failed:"#fef2f2", Refunded:"#f5f3ff" };
const P_TXT: Record<string,string> = { Confirmed:"#065f46", Pending:"#b45309", COD:"#475569", Failed:"#dc2626",  Refunded:"#6d28d9" };
const P_BDR: Record<string,string> = { Confirmed:"#a7f3d0", Pending:"#fde68a", COD:"#e2e8f0", Failed:"#fecaca", Refunded:"#ddd6fe" };

function DPill({ label }: { label: string }) {
    return <span style={{ display:"inline-block", padding:"3px 10px", fontSize:"9px", fontWeight:900, textTransform:"uppercase" as const, letterSpacing:"0.1em", backgroundColor:D_BG[label]??"#f9fafb", color:D_TXT[label]??"#374151", border:`1px solid ${D_BDR[label]??"#e5e7eb"}` }}>{label}</span>;
}
function PPill({ label }: { label: string }) {
    return <span style={{ display:"inline-block", padding:"3px 10px", fontSize:"9px", fontWeight:900, textTransform:"uppercase" as const, letterSpacing:"0.1em", backgroundColor:P_BG[label]??"#f9fafb", color:P_TXT[label]??"#374151", border:`1px solid ${P_BDR[label]??"#e5e7eb"}` }}>{label}</span>;
}

const STEP_COLORS: Record<string,string> = { Pending:"#f59e0b", Processing:"#3b82f6", Shipped:"#8b5cf6", Delivered:"#10b981" };

function DeliveryTimeline({ steps, current, orderId }: { steps: string[]; current: string; orderId: number }) {
    const isCancelled = current === "Cancelled";
    const currentIdx  = steps.indexOf(current);
    const { errors }: any = usePage().props;

    const handleUpdate = (step: string) => {
        router.patch(route("admin.orders.updateDelivery", orderId), { delivery_status: step }, { preserveScroll: true });
    };

    if (isCancelled) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 0" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#dc2626", border: "2px solid #dc2626", flexShrink: 0 }} />
                <span style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.15em", color: "#dc2626" }}>Order Cancelled — Status updates unavailable</span>
            </div>
        );
    }

    const nextStep    = steps[currentIdx + 1] ?? null;
    const isDelivered = currentIdx === steps.length - 1;

    return (
        <div>
            {/* Progress dots */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "28px" }}>
                {steps.map((step, i) => {
                    const done = i <= currentIdx; const active = i === currentIdx;
                    return (
                        <React.Fragment key={step}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <div style={{ width: active ? "16px" : "12px", height: active ? "16px" : "12px", borderRadius: "50%", border: `2px solid ${done ? "#0A0A0A" : "#e5e7eb"}`, backgroundColor: done ? "#0A0A0A" : "#fff", transition: "all 0.2s" }} />
                                <span style={{ marginTop: "8px", fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", whiteSpace: "nowrap", color: active ? "#0A0A0A" : done ? "rgba(45,50,62,0.5)" : "rgba(45,50,62,0.2)" }}>{step}</span>
                            </div>
                            {i < steps.length - 1 && <div style={{ flex: 1, height: "1px", margin: "0 4px", marginBottom: "20px", backgroundColor: i < currentIdx ? "#0A0A0A" : "#e5e7eb" }} />}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Action area — current badge + single next-step button only */}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "10px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {current} (Current)
                </div>

                {isDelivered ? (
                    <span style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "rgba(45,50,62,0.35)" }}>
                        Final status reached
                    </span>
                ) : (
                    <button
                        onClick={() => handleUpdate(nextStep!)}
                        style={{ padding: "10px 20px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", border: "1px solid #0A0A0A", backgroundColor: "#fff", color: "#0A0A0A", cursor: "pointer" }}
                    >
                        → Mark as {nextStep}
                    </button>
                )}
            </div>

            {/* Backend validation error */}
            {errors?.delivery_status && (
                <p style={{ marginTop: "10px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#dc2626" }}>
                    {errors.delivery_status}
                </p>
            )}
        </div>
    );
}

// ── Admin Cancel Modal ────────────────────────────────────────────────────────
function AdminCancelModal({ order, onClose }: { order: Order; onClose: () => void }) {
    const [reason,     setReason]     = useState("");
    const [note,       setNote]       = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { errors }: any = usePage().props;

    const handleSubmit = () => {
        if (!reason) return;
        setSubmitting(true);
        router.post(route("admin.orders.cancel", order.id), {
            cancellation_reason: reason,
            cancellation_note:   note,
        }, {
            preserveScroll: true,
            onSuccess: () => { setSubmitting(false); onClose(); },
            onError:   () => setSubmitting(false),
        });
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(10,10,10,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />
            <div style={{ position: "relative", backgroundColor: "#fff", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", zIndex: 10 }}>

                {/* Header */}
                <div style={{ borderBottom: "1px solid #f0f0f0", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <p style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "4px" }}>Cancel Order</p>
                        <h3 style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "-0.01em" }}>{order.order_number}</h3>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(45,50,62,0.3)", padding: "4px" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* Items summary */}
                    <div style={{ backgroundColor: "#fafafa", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <p style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "4px" }}>Order Items</p>
                        {order.items.map(item => (
                            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                                <span style={{ color: "rgba(45,50,62,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, paddingRight: "12px" }}>
                                    {item.brand_name} {item.product_name} — {item.size_value} / {item.color_name} × {item.quantity}
                                </span>
                                <span style={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>${parseFloat(item.subtotal).toFixed(2)}</span>
                            </div>
                        ))}
                        <div style={{ paddingTop: "10px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 900, textTransform: "uppercase" as const }}>
                            <span>Total</span>
                            <span style={{ fontVariantNumeric: "tabular-nums" }}>${parseFloat(order.total_amount).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <p style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "12px" }}>
                            Cancellation Reason <span style={{ color: "#dc2626" }}>*</span>
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {REASONS.map(r => (
                                <label key={r} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${reason === r ? "#0A0A0A" : "#e5e7eb"}`, backgroundColor: reason === r ? "#0A0A0A" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                                        {reason === r && <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#fff" }} />}
                                    </div>
                                    <input type="radio" style={{ display: "none" }} value={r} checked={reason === r} onChange={() => setReason(r)} />
                                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "rgba(45,50,62,0.65)" }}>{r}</span>
                                </label>
                            ))}
                        </div>
                        {errors?.cancellation_reason && <p style={{ marginTop: "6px", fontSize: "9px", fontWeight: 700, color: "#dc2626" }}>{errors.cancellation_reason}</p>}
                    </div>

                    {/* Other note */}
                    {reason === "Other" && (
                        <div>
                            <p style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "8px" }}>
                                Additional Notes <span style={{ color: "#dc2626" }}>*</span>
                            </p>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Provide additional context..."
                                rows={3}
                                maxLength={500}
                                style={{ width: "100%", border: "1px solid #e5e7eb", padding: "10px 14px", fontSize: "11px", fontWeight: 500, outline: "none", fontFamily: "inherit", resize: "none", boxSizing: "border-box" as const }}
                            />
                            {errors?.cancellation_note && <p style={{ fontSize: "9px", fontWeight: 700, color: "#dc2626", marginTop: "4px" }}>{errors.cancellation_note}</p>}
                        </div>
                    )}

                    {/* Error */}
                    {errors?.cancel && (
                        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", padding: "12px 16px" }}>
                            <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#dc2626" }}>{errors.cancel}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
                        <button
                            onClick={handleSubmit}
                            disabled={!reason || (reason === "Other" && !note.trim()) || submitting}
                            style={{ flex: 1, padding: "12px", backgroundColor: submitting || !reason || (reason === "Other" && !note.trim()) ? "#d1d5db" : "#dc2626", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.15em", border: "none", cursor: submitting ? "wait" : "pointer" }}
                        >
                            {submitting ? "Cancelling..." : "Confirm Cancellation"}
                        </button>
                        <button
                            onClick={onClose}
                            style={{ flex: 1, padding: "12px", backgroundColor: "#fff", color: "#0A0A0A", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.15em", border: "1px solid #0A0A0A", cursor: "pointer" }}
                        >
                            Keep Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminOrdersShow({ order, deliverySteps, admin }: Props) {
    const { flash }: any = usePage().props;
    const [showCancelModal, setShowCancelModal] = useState(false);

    const isCancelled  = order.order_status === "Cancelled";
    const placedAt     = order.placed_at ? new Date(order.placed_at) : null;
    const hoursElapsed = placedAt ? (Date.now() - placedAt.getTime()) / 3600000 : 999;
    const canCancel    = !isCancelled && order.delivery_status === "Pending" && hoursElapsed <= 24;

    return (
        <AdminLayout
            adminName={admin.name}
            active="orders"
            pageTitle={order.order_number}
            pageLabel="Order Detail"
            headerRight={
                canCancel ? (
                    <button
                        onClick={() => setShowCancelModal(true)}
                        style={{ padding: "8px 20px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer" }}
                    >
                        Cancel Order
                    </button>
                ) : undefined
            }
        >
            <Head title={`Admin — ${order.order_number}`} />

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Link href={route("admin.orders.index")} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.35)", textDecoration: "none" }}>← Orders</Link>
                    <span style={{ color: "rgba(45,50,62,0.2)" }}>/</span>
                    <span style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>{order.order_number}</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <DPill label={order.delivery_status} />
                    <PPill label={order.payment_status} />
                </div>
            </div>

            {/* Flash */}
            {flash?.success && (
                <div style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", padding: "14px 20px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#065f46", marginBottom: "20px" }}>
                    ✓ {flash.success}
                </div>
            )}

            {/* Cancelled banner */}
            {isCancelled && (
                <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", padding: "16px 20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#dc2626" }}>✕ Order Cancelled</p>
                    {order.cancellation_reason && (
                        <p style={{ fontSize: "10px", fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Reason: {order.cancellation_reason}{order.cancellation_note ? ` — ${order.cancellation_note}` : ""}
                        </p>
                    )}
                    {order.cancelled_at && (
                        <p style={{ fontSize: "9px", color: "rgba(185,28,28,0.6)", fontWeight: 600 }}>
                            Cancelled on {fmtDate(order.cancelled_at)}
                        </p>
                    )}
                </div>
            )}

            {/* Order meta */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 32px", marginBottom: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px" }}>
                    {[
                        { label: "Order Number", value: order.order_number },
                        { label: "Placed",       value: order.placed_at ? fmtDate(order.placed_at) : "—" },
                        { label: "Customer",     value: order.customer_name ?? order.shipping_full_name, sub: order.customer_email ?? undefined },
                        { label: "Subtotal",    value: `$${(parseFloat(order.total_amount) - parseFloat(order.shipping_fee ?? '0')).toFixed(2)}` },
                            { label: "Shipping Fee", value: order.shipping_fee && parseFloat(order.shipping_fee) > 0 ? `$${parseFloat(order.shipping_fee).toFixed(2)}` : "Free" },
                            { label: "Order Total",  value: `$${parseFloat(order.total_amount).toFixed(2)}`, big: true },
                    ].map(item => (
                        <div key={item.label}>
                            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(45,50,62,0.3)", marginBottom: "6px" }}>{item.label}</p>
                            <p style={{ fontSize: (item as any).big ? "24px" : "13px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{item.value}</p>
                            {(item as any).sub && <p style={{ fontSize: "10px", color: "rgba(45,50,62,0.4)", marginTop: "2px" }}>{(item as any).sub}</p>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Delivery control */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "28px 32px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                    <div>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "4px" }}>Delivery Status</p>
                        <h3 style={{ fontSize: "17px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Update Fulfillment</h3>
                    </div>
                    <DPill label={order.delivery_status} />
                </div>
                <DeliveryTimeline steps={deliverySteps} current={order.delivery_status} orderId={order.id} />
            </div>

            {/* Two-column lower */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>

                {/* Items */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0" }}>
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid #f5f5f5" }}>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)" }}>
                            Items — {order.items.length} {order.items.length === 1 ? "pair" : "pairs"}
                        </p>
                    </div>
                    {order.items.map(item => (
                        <div key={item.id} style={{ display: "flex", gap: "20px", padding: "20px 24px", borderBottom: "1px solid #fafafa" }}>
                            <div style={{ width: "64px", height: "64px", backgroundColor: "#f9fafb", flexShrink: 0, overflow: "hidden" }}>
                                {item.image_url
                                    ? <img src={item.image_url} alt={item.product_name} style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply", padding: "4px" }} />
                                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "#d1d5db", fontWeight: 700 }}>N/A</div>
                                }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.3)" }}>{item.brand_name}</p>
                                <p style={{ fontSize: "13px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", marginTop: "2px" }}>{item.product_name}</p>
                                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                    {[item.size_value, item.color_name, `Qty: ${item.quantity}`].map(tag => (
                                        <span key={tag} style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", backgroundColor: "#f9fafb", padding: "2px 8px", color: "rgba(45,50,62,0.5)" }}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <p style={{ fontSize: "13px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>${parseFloat(item.subtotal).toFixed(2)}</p>
                                <p style={{ fontSize: "9px", color: "rgba(45,50,62,0.3)", marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>${parseFloat(item.unit_price).toFixed(2)} ea</p>
                            </div>
                        </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}>
                        <span style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.3)" }}>Order Total</span>
                        <div>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "10px", color: "rgba(45,50,62,0.5)", fontWeight: 700 }}>
                                                <span>Shipping</span>
                                                <span>{order.shipping_fee && parseFloat(order.shipping_fee) > 0 ? `$${parseFloat(order.shipping_fee).toFixed(2)}` : "Free"}</span>
                                            </div>
                                            <span style={{ fontSize: "20px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>${parseFloat(order.total_amount).toFixed(2)}</span>
                                        </div>
                    </div>
                </div>

                {/* Right */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "20px 24px" }}>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "16px" }}>Ship To</p>
                        <div style={{ fontSize: "12px", lineHeight: 1.8, color: "rgba(45,50,62,0.7)" }}>
                            <p style={{ fontWeight: 900, color: "#0A0A0A" }}>{order.shipping_full_name}</p>
                            <p>{order.shipping_phone}</p>
                            <p>{order.shipping_address_line}</p>
                            <p>{order.shipping_city}{order.shipping_state_region ? `, ${order.shipping_state_region}` : ""}{order.shipping_postal_code ? ` ${order.shipping_postal_code}` : ""}</p>
                            <p>{order.shipping_country}</p>
                        </div>
                    </div>
                    <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "20px 24px" }}>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "16px" }}>Payment</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {[
                                order.payment_method  ? { label: "Method",     value: order.payment_method } : null,
                                order.cardholder_name ? { label: "Cardholder", value: order.cardholder_name } : null,
                                order.card_last4      ? { label: "Card",       value: `•••• ${order.card_last4}`, mono: true } : null,
                            ].filter(Boolean).map((row: any) => (
                                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.45)" }}>{row.label}</span>
                                    <span style={{ fontSize: "12px", fontWeight: 900, fontFamily: row.mono ? "monospace" : "inherit" }}>{row.value}</span>
                                </div>
                            ))}
                            {order.payment_status_detail && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.45)" }}>Status</span>
                                    <PPill label={order.payment_status_detail} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <AdminCancelModal order={order} onClose={() => setShowCancelModal(false)} />
            )}
        </AdminLayout>
    );
}
