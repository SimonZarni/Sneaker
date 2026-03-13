import React from "react";
import { Head, Link } from "@inertiajs/react";

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
    delivery_status: string;
    payment_status: string;
    placed_at: string | null;
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
    items: OrderItem[];
}

interface Props { order: Order }

const DELIVERY_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

function fmt(val: string | number) {
    return `$${parseFloat(String(val)).toFixed(2)}`;
}

export default function OrderSuccess({ order }: Props) {
    const currentStep = DELIVERY_STEPS.indexOf(order.delivery_status);
    const isCOD = order.payment_method === "Cash on Delivery";

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#F5F5F7", fontFamily: "inherit" }}>
            <Head title={`Order Confirmed — ${order.order_number}`} />

            {/* ── NAVBAR ── */}
            <nav style={{ backgroundColor: "#0A0A0A", padding: "0 40px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
                <Link href={route("home")} style={{ fontSize: "15px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", color: "#fff", textDecoration: "none" }}>
                    SNEAKER.DRP
                </Link>
                <Link href={route("orders.index")} style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
                    My Orders
                </Link>
            </nav>

            <div style={{ maxWidth: "960px", margin: "0 auto", padding: "48px 24px 80px" }}>

                {/* ── CONFIRMATION HEADER ── */}
                <div style={{ textAlign: "center", marginBottom: "48px" }}>
                    {/* Checkmark */}
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>

                    <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.4em", color: "rgba(45,50,62,0.4)", marginBottom: "10px" }}>
                        Order Confirmed
                    </p>
                    <h1 style={{ fontSize: "36px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "12px" }}>
                        Thank You!
                    </h1>
                    <p style={{ fontSize: "13px", color: "rgba(45,50,62,0.5)", fontWeight: 600 }}>
                        Order <span style={{ fontWeight: 900, color: "#0A0A0A" }}>{order.order_number}</span> has been placed successfully.
                    </p>

                    {isCOD && (
                        <div style={{ display: "inline-block", marginTop: "16px", padding: "10px 20px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#92400e" }}>
                            💵 Cash on Delivery — please have the exact amount ready
                        </div>
                    )}
                </div>

                {/* ── DELIVERY TRACKER ── */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "32px 40px", marginBottom: "20px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "28px" }}>
                        Delivery Status
                    </p>

                    <div style={{ display: "flex", alignItems: "flex-start" }}>
                        {DELIVERY_STEPS.map((step, i) => {
                            const done   = i <= currentStep;
                            const active = i === currentStep;
                            return (
                                <React.Fragment key={step}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                                        <div style={{
                                            width: "14px", height: "14px", borderRadius: "50%",
                                            backgroundColor: done ? "#0A0A0A" : "#fff",
                                            border: `2px solid ${done ? "#0A0A0A" : "#e5e7eb"}`,
                                            transform: active ? "scale(1.3)" : "scale(1)",
                                            transition: "all 0.2s",
                                        }} />
                                        <span style={{
                                            marginTop: "10px", fontSize: "9px", fontWeight: 900,
                                            textTransform: "uppercase", letterSpacing: "0.1em",
                                            color: active ? "#0A0A0A" : done ? "rgba(45,50,62,0.5)" : "rgba(45,50,62,0.2)",
                                            whiteSpace: "nowrap",
                                        }}>
                                            {step}
                                        </span>
                                        {active && (
                                            <span style={{ marginTop: "4px", fontSize: "8px", fontWeight: 700, color: "rgba(45,50,62,0.35)", letterSpacing: "0.05em" }}>
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    {i < DELIVERY_STEPS.length - 1 && (
                                        <div style={{
                                            flex: 1, height: "2px", marginTop: "6px", marginBottom: "24px",
                                            backgroundColor: i < currentStep ? "#0A0A0A" : "#e5e7eb",
                                            transition: "background-color 0.3s",
                                        }} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* ── TWO-COLUMN LAYOUT ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>

                    {/* Left — order items */}
                    <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0" }}>
                        <div style={{ padding: "20px 28px", borderBottom: "1px solid #f5f5f5" }}>
                            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)" }}>
                                Your Items — {order.items.reduce((s, i) => s + i.quantity, 0)} {order.items.reduce((s, i) => s + i.quantity, 0) === 1 ? "pair" : "pairs"}
                            </p>
                        </div>

                        {order.items.map((item) => (
                            <div key={item.id} style={{ display: "flex", gap: "16px", padding: "16px 28px", borderBottom: "1px solid #fafafa" }}>
                                <div style={{ width: "64px", height: "64px", backgroundColor: "#f9fafb", flexShrink: 0, overflow: "hidden" }}>
                                    {item.image_url
                                        ? <img src={item.image_url} alt={item.product_name} style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply", padding: "4px" }} />
                                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "#d1d5db" }}>IMG</div>
                                    }
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.35)", marginBottom: "3px" }}>
                                        {item.brand_name}
                                    </p>
                                    <p style={{ fontSize: "13px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                                        {item.product_name}
                                    </p>
                                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                                        {[item.size_value, item.color_name, `Qty: ${item.quantity}`].map((tag) => (
                                            <span key={tag} style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#f5f5f7", padding: "2px 8px", color: "rgba(45,50,62,0.5)" }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <p style={{ fontSize: "13px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{fmt(item.subtotal)}</p>
                                    <p style={{ fontSize: "9px", color: "rgba(45,50,62,0.3)", marginTop: "2px" }}>{fmt(item.unit_price)} ea</p>
                                </div>
                            </div>
                        ))}

                        {/* Total row */}
                        <div style={{ padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.4)" }}>Order Total</span>
                            <span style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{fmt(order.total_amount)}</span>
                        </div>
                    </div>

                    {/* Right — delivery + payment */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                        {/* Shipping address */}
                        <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 28px" }}>
                            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "16px" }}>
                                Ship To
                            </p>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(45,50,62,0.7)", lineHeight: 1.8 }}>
                                <p style={{ fontWeight: 900, color: "#0A0A0A" }}>{order.shipping_full_name}</p>
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

                        {/* Payment info */}
                        <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 28px" }}>
                            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "16px" }}>
                                Payment
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)" }}>Method</span>
                                    <span style={{ fontSize: "11px", fontWeight: 900 }}>{order.payment_method ?? "—"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)" }}>Status</span>
                                    <span style={{
                                        fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
                                        padding: "3px 10px", border: "1px solid",
                                        ...(order.payment_status === "Confirmed"
                                            ? { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }
                                            : { backgroundColor: "#fffbeb", borderColor: "#fde68a", color: "#92400e" })
                                    }}>
                                        {order.payment_status}
                                    </span>
                                </div>
                                {order.cardholder_name && (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)" }}>Cardholder</span>
                                        <span style={{ fontSize: "11px", fontWeight: 900 }}>{order.cardholder_name}</span>
                                    </div>
                                )}
                                {order.card_last4 && (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)" }}>Card</span>
                                        <span style={{ fontSize: "11px", fontWeight: 900, fontFamily: "monospace" }}>•••• {order.card_last4}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CTAs */}
                        <Link
                            href={route("orders.show", order.id)}
                            style={{ display: "block", padding: "14px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", textAlign: "center", textDecoration: "none" }}
                        >
                            View Order Details
                        </Link>
                        <Link
                            href={route("shop.index")}
                            style={{ display: "block", padding: "14px", backgroundColor: "transparent", color: "rgba(45,50,62,0.5)", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", textAlign: "center", textDecoration: "none", border: "1px solid #e5e7eb" }}
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
