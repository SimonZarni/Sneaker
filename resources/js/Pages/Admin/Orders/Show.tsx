import React from "react";
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
    order_status: string;
    payment_status: string;
    delivery_status: string;
    placed_at: string;
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

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

const D_BG: Record<string,string>  = { Pending:"#fffbeb", Processing:"#eff6ff", Shipped:"#f5f3ff", Delivered:"#ecfdf5" };
const D_TXT: Record<string,string> = { Pending:"#b45309", Processing:"#1d4ed8", Shipped:"#6d28d9", Delivered:"#065f46" };
const D_BDR: Record<string,string> = { Pending:"#fde68a", Processing:"#bfdbfe", Shipped:"#ddd6fe", Delivered:"#a7f3d0" };
const P_BG: Record<string,string>  = { Confirmed:"#ecfdf5", Pending:"#fffbeb", COD:"#f8fafc", Failed:"#fef2f2" };
const P_TXT: Record<string,string> = { Confirmed:"#065f46", Pending:"#b45309", COD:"#475569", Failed:"#dc2626" };
const P_BDR: Record<string,string> = { Confirmed:"#a7f3d0", Pending:"#fde68a", COD:"#e2e8f0", Failed:"#fecaca" };

function DPill({ label }: { label: string }) {
    return <span style={{ display:"inline-block", padding:"3px 10px", fontSize:"9px", fontWeight:900, textTransform:"uppercase" as const, letterSpacing:"0.1em", backgroundColor:D_BG[label]??"#f9fafb", color:D_TXT[label]??"#374151", border:`1px solid ${D_BDR[label]??"#e5e7eb"}` }}>{label}</span>;
}
function PPill({ label }: { label: string }) {
    return <span style={{ display:"inline-block", padding:"3px 10px", fontSize:"9px", fontWeight:900, textTransform:"uppercase" as const, letterSpacing:"0.1em", backgroundColor:P_BG[label]??"#f9fafb", color:P_TXT[label]??"#374151", border:`1px solid ${P_BDR[label]??"#e5e7eb"}` }}>{label}</span>;
}

const STEP_COLORS: Record<string,string> = { Pending:"#f59e0b", Processing:"#3b82f6", Shipped:"#8b5cf6", Delivered:"#10b981" };

function DeliveryTimeline({ steps, current, orderId }: { steps: string[]; current: string; orderId: number }) {
    const currentIdx = steps.indexOf(current);

    const handleUpdate = (step: string) => {
        if (step === current) return;
        router.patch(route("admin.orders.updateDelivery", orderId), { delivery_status: step }, { preserveScroll: true });
    };

    return (
        <div>
            {/* Progress track */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "28px" }}>
                {steps.map((step, i) => {
                    const done   = i <= currentIdx;
                    const active = i === currentIdx;
                    return (
                        <React.Fragment key={step}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <div style={{
                                    width: active ? "16px" : "12px",
                                    height: active ? "16px" : "12px",
                                    borderRadius: "50%",
                                    border: `2px solid ${done ? "#0A0A0A" : "#e5e7eb"}`,
                                    backgroundColor: done ? "#0A0A0A" : "#fff",
                                    transition: "all 0.2s",
                                }} />
                                <span style={{ marginTop: "8px", fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap", color: active ? "#0A0A0A" : done ? "rgba(45,50,62,0.5)" : "rgba(45,50,62,0.2)" }}>
                                    {step}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div style={{ flex: 1, height: "1px", margin: "0 4px", marginBottom: "20px", backgroundColor: i < currentIdx ? "#0A0A0A" : "#e5e7eb", transition: "background-color 0.2s" }} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {steps.map((step, i) => {
                    const isCurrent = step === current;
                    const isAhead   = i > currentIdx;

                    if (isCurrent) {
                        return (
                            <div key={step} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {step} (Current)
                            </div>
                        );
                    }

                    return (
                        <button
                            key={step}
                            onClick={() => handleUpdate(step)}
                            style={{
                                padding: "10px 20px", fontSize: "9px", fontWeight: 900,
                                textTransform: "uppercase", letterSpacing: "0.1em",
                                border: `1px solid ${isAhead ? "#0A0A0A" : "#e5e7eb"}`,
                                backgroundColor: "#fff",
                                color: isAhead ? "#0A0A0A" : "rgba(45,50,62,0.3)",
                                cursor: "pointer",
                            }}
                        >
                            {i < currentIdx ? "↩ Revert to" : "→ Mark as"} {step}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function AdminOrdersShow({ order, deliverySteps, admin }: Props) {
    const { flash }: any = usePage().props;

    return (
        <AdminLayout adminName={admin.name} active="orders" pageTitle={order.order_number} pageLabel="Order Detail">
            <Head title={`Admin — ${order.order_number}`} />

            {/* Breadcrumb + status pills */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Link href={route("admin.orders.index")} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.35)", textDecoration: "none" }}>
                        ← Orders
                    </Link>
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

            {/* Order meta */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 32px", marginBottom: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px" }}>
                    {[
                        { label: "Order Number", value: order.order_number, big: false },
                        { label: "Placed",       value: order.placed_at ? fmtDate(order.placed_at) : "—", big: false },
                        { label: "Customer",     value: order.customer_name ?? order.shipping_full_name, sub: order.customer_email ?? undefined, big: false },
                        { label: "Order Total",  value: `$${parseFloat(order.total_amount).toFixed(2)}`, big: true },
                    ].map((item) => (
                        <div key={item.label}>
                            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(45,50,62,0.3)", marginBottom: "6px" }}>{item.label}</p>
                            <p style={{ fontSize: item.big ? "24px" : "13px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{item.value}</p>
                            {item.sub && <p style={{ fontSize: "10px", color: "rgba(45,50,62,0.4)", marginTop: "2px" }}>{item.sub}</p>}
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

            {/* Two-column lower section */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>

                {/* Items */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0" }}>
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid #f5f5f5" }}>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)" }}>
                            Items — {order.items.length} {order.items.length === 1 ? "pair" : "pairs"}
                        </p>
                    </div>
                    {order.items.map((item) => (
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
                                    {[item.size_value, item.color_name, `Qty: ${item.quantity}`].map((tag) => (
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
                        <span style={{ fontSize: "20px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>${parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                </div>

                {/* Right: shipping + payment */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Shipping */}
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

                    {/* Payment */}
                    <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "20px 24px" }}>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "16px" }}>Payment</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {[
                                order.payment_method    ? { label: "Method",     value: order.payment_method,    pill: false } : null,
                                order.cardholder_name   ? { label: "Cardholder", value: order.cardholder_name,   pill: false } : null,
                                order.card_last4        ? { label: "Card",       value: `•••• ${order.card_last4}`, pill: false, mono: true } : null,
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
        </AdminLayout>
    );
}
