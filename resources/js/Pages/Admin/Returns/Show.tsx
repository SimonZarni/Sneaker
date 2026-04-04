import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";

interface ReturnItemRow {
    id: number;
    quantity: number;
    reason: string;
    photo_url: string | null;
    product_name: string | null;
    brand_name: string | null;
    color_name: string | null;
    size_value: string | null;
    unit_price: string | null;
    image_url: string | null;
}

interface ReturnRequestDetail {
    id: number;
    status: string;
    refund_method: string;
    refund_account_details: string | null;
    refund_amount: string | null;
    admin_note: string | null;
    requested_at: string;
    resolved_at: string | null;
    customer_name: string;
    customer_email: string;
    order_id: number;
    order_number: string;
    order_total: string;
    payment_method: string | null;
    card_last4: string | null;
    items: ReturnItemRow[];
}

interface Props {
    returnRequest: ReturnRequestDetail;
    admin: { name: string };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
    Pending:  { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    Approved: { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
    Rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    Refunded: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
};

function StatusPill({ label }: { label: string }) {
    const s = STATUS_STYLES[label] ?? { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" };
    return (
        <span style={{
            display: "inline-block", padding: "4px 12px", fontSize: 9,
            fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
            backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
        }}>
            {label}
        </span>
    );
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtPrice(val: string | number | null) {
    if (val === null || val === undefined) return "—";
    return `$${parseFloat(String(val)).toFixed(2)}`;
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ returnId, onClose }: { returnId: number; onClose: () => void }) {
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { errors }: any = usePage().props;

    const handleSubmit = () => {
        if (!note.trim()) return;
        setSubmitting(true);
        router.post(route("admin.returns.reject", returnId), { admin_note: note }, {
            preserveScroll: true,
            onSuccess: () => { setSubmitting(false); onClose(); },
            onError: () => setSubmitting(false),
        });
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
            <div style={{ position: "relative", background: "#fff", width: "100%", maxWidth: 480, padding: 32, zIndex: 10 }}>
                <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "#9ca3af", marginBottom: 8 }}>Reject Return</p>
                <h3 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", marginBottom: 24 }}>Reason for Rejection</h3>

                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Explain why the return is being rejected..."
                    rows={4}
                    maxLength={500}
                    style={{ width: "100%", border: "1px solid #e5e7eb", padding: "10px 14px", fontSize: 12, fontWeight: 500, outline: "none", resize: "none", boxSizing: "border-box" }}
                />
                <p style={{ fontSize: 9, color: "#9ca3af", textAlign: "right", marginTop: 4 }}>{note.length}/500</p>
                {errors?.admin_note && <p style={{ fontSize: 10, color: "#dc2626", fontWeight: 700, marginTop: 4 }}>{errors.admin_note}</p>}

                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                    <button
                        onClick={handleSubmit}
                        disabled={!note.trim() || submitting}
                        style={{
                            flex: 1, padding: "12px", background: "#dc2626", color: "#fff",
                            border: "none", cursor: "pointer", fontSize: 9, fontWeight: 900,
                            textTransform: "uppercase", letterSpacing: "0.2em", opacity: (!note.trim() || submitting) ? 0.4 : 1,
                        }}
                    >
                        {submitting ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: "12px", background: "#fff", color: "#0A0A0A",
                            border: "1px solid #0A0A0A", cursor: "pointer", fontSize: 9, fontWeight: 900,
                            textTransform: "uppercase", letterSpacing: "0.2em",
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminReturnsShow({ returnRequest: r, admin }: Props) {
    const { flash }: any = usePage().props;
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [submitting, setSubmitting] = useState<string | null>(null);

    const handleApprove = () => {
        setSubmitting("approve");
        router.post(route("admin.returns.approve", r.id), {}, {
            preserveScroll: true,
            onFinish: () => setSubmitting(null),
        });
    };

    const handleRefund = () => {
        setSubmitting("refund");
        router.post(route("admin.returns.refund", r.id), {}, {
            preserveScroll: true,
            onFinish: () => setSubmitting(null),
        });
    };

    const refundTotal = r.items.reduce((sum, item) => {
        return sum + (item.unit_price ? parseFloat(item.unit_price) * item.quantity : 0);
    }, 0);

    return (
        <AdminLayout
            adminName={admin.name}
            active="returns"
            pageLabel="Returns"
            pageTitle={`Return #${r.id}`}
            headerRight={
                <Link href={route("admin.returns.index")} style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", textDecoration: "none", borderBottom: "1px solid currentColor" }}>
                    ← All Returns
                </Link>
            }
        >
            <Head title={`Return #${r.id} — Admin`} />

            {/* Flash */}
            {flash?.success && (
                <div style={{ marginBottom: 20, padding: "12px 16px", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", fontSize: 11, fontWeight: 700 }}>
                    {flash.success}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

                {/* LEFT */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Header card */}
                    <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: 24 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                            <div>
                                <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "#9ca3af", marginBottom: 4 }}>Return Request</p>
                                <h2 style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em" }}>#{r.id}</h2>
                                <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                                    Submitted {fmtDate(r.requested_at)}
                                    {r.resolved_at ? ` · Resolved ${fmtDate(r.resolved_at)}` : ""}
                                </p>
                            </div>
                            <StatusPill label={r.status} />
                        </div>
                    </div>

                    {/* Items to return */}
                    <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: 24 }}>
                        <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "#9ca3af", marginBottom: 16 }}>Items Requested for Return</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {r.items.map(item => (
                                <div key={item.id} style={{ display: "flex", gap: 16, padding: 16, background: "#f9fafb", border: "1px solid #f0f0f0" }}>
                                    {/* Product image */}
                                    <div style={{ width: 72, height: 72, background: "#f3f4f6", flexShrink: 0, overflow: "hidden" }}>
                                        {item.image_url
                                            ? <img src={item.image_url} alt={item.product_name ?? ""} style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply", padding: 4 }} />
                                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <span style={{ fontSize: 8, color: "#d1d5db", fontWeight: 700, textTransform: "uppercase" }}>No img</span>
                                              </div>
                                        }
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#9ca3af" }}>{item.brand_name}</p>
                                        <p style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginTop: 2 }}>{item.product_name}</p>
                                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                                            {[item.size_value, item.color_name, `Qty: ${item.quantity}`].map(tag => tag && (
                                                <span key={tag} style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", background: "#e5e7eb", padding: "2px 8px", color: "#6b7280" }}>{tag}</span>
                                            ))}
                                            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.1em", background: "#e5e7eb", padding: "2px 8px", color: "#0A0A0A" }}>
                                                {fmtPrice(item.unit_price ? parseFloat(item.unit_price) * item.quantity : null)}
                                            </span>
                                        </div>
                                        <div style={{ marginTop: 10 }}>
                                            <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#9ca3af", marginBottom: 2 }}>Reason</p>
                                            <p style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{item.reason}</p>
                                        </div>
                                    </div>

                                    {/* Photo proof */}
                                    {item.photo_url && (
                                        <div style={{ flexShrink: 0 }}>
                                            <p style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#9ca3af", marginBottom: 6 }}>Photo</p>
                                            <a href={item.photo_url} target="_blank" rel="noreferrer">
                                                <img src={item.photo_url} alt="Return proof" style={{ width: 80, height: 80, objectFit: "cover", border: "1px solid #e5e7eb" }} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Refund total */}
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#6b7280" }}>
                                {r.refund_amount ? "Approved Refund" : "Estimated Refund"}
                            </p>
                            <p style={{ fontSize: 18, fontWeight: 900 }}>
                                {r.refund_amount ? fmtPrice(r.refund_amount) : fmtPrice(refundTotal)}
                            </p>
                        </div>
                    </div>

                    {/* Admin note (if rejected) */}
                    {r.status === "Rejected" && r.admin_note && (
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 20 }}>
                            <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#dc2626", marginBottom: 6 }}>Rejection Reason</p>
                            <p style={{ fontSize: 12, color: "#7f1d1d", fontWeight: 600 }}>{r.admin_note}</p>
                        </div>
                    )}
                </div>

                {/* RIGHT */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Customer */}
                    <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: 20 }}>
                        <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "#9ca3af", marginBottom: 12 }}>Customer</p>
                        <p style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase" }}>{r.customer_name}</p>
                        <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{r.customer_email}</p>
                    </div>

                    {/* Order link */}
                    <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: 20 }}>
                        <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "#9ca3af", marginBottom: 12 }}>Original Order</p>
                        <Link href={route("admin.orders.show", r.order_id)} style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", color: "#0A0A0A", textDecoration: "none", borderBottom: "2px solid currentColor" }}>
                            {r.order_number} ↗
                        </Link>
                        <p style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>Total: {fmtPrice(r.order_total)}</p>
                    </div>

                    {/* Refund method */}
                    <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: 20 }}>
                        <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "#9ca3af", marginBottom: 12 }}>Refund Method</p>
                        <p style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.refund_method}</p>
                        {r.refund_method === "Original Card" && r.card_last4 && (
                            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6, fontFamily: "monospace" }}>•••• {r.card_last4}</p>
                        )}
                        {r.refund_account_details && (
                            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>{r.refund_account_details}</p>
                        )}
                    </div>

                    {/* Actions */}
                    {r.status === "Pending" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <button
                                onClick={handleApprove}
                                disabled={submitting === "approve"}
                                style={{
                                    padding: "14px", background: "#065f46", color: "#fff", border: "none",
                                    cursor: "pointer", fontSize: 9, fontWeight: 900, textTransform: "uppercase",
                                    letterSpacing: "0.2em", opacity: submitting === "approve" ? 0.6 : 1,
                                }}
                            >
                                {submitting === "approve" ? "Approving..." : "Approve Return"}
                            </button>
                            <button
                                onClick={() => setShowRejectModal(true)}
                                style={{
                                    padding: "14px", background: "#fff", color: "#dc2626", border: "1px solid #fecaca",
                                    cursor: "pointer", fontSize: 9, fontWeight: 900, textTransform: "uppercase",
                                    letterSpacing: "0.2em",
                                }}
                            >
                                Reject Return
                            </button>
                        </div>
                    )}

                    {r.status === "Approved" && (
                        <button
                            onClick={handleRefund}
                            disabled={submitting === "refund"}
                            style={{
                                padding: "14px", background: "#6d28d9", color: "#fff", border: "none",
                                cursor: "pointer", fontSize: 9, fontWeight: 900, textTransform: "uppercase",
                                letterSpacing: "0.2em", opacity: submitting === "refund" ? 0.6 : 1,
                            }}
                        >
                            {submitting === "refund" ? "Processing..." : `Mark Refunded — ${fmtPrice(r.refund_amount)}`}
                        </button>
                    )}

                    {(r.status === "Rejected" || r.status === "Refunded") && (
                        <div style={{ padding: 16, background: "#f9fafb", border: "1px solid #f0f0f0", textAlign: "center" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                This return is {r.status.toLowerCase()} — no further actions available.
                            </p>
                        </div>
                    )}

                    <Link
                        href={route("admin.returns.index")}
                        style={{
                            display: "block", padding: "12px", border: "1px solid #e5e7eb", textAlign: "center",
                            fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em",
                            color: "#0A0A0A", textDecoration: "none",
                        }}
                    >
                        ← Back to Returns
                    </Link>
                </div>
            </div>

            {showRejectModal && <RejectModal returnId={r.id} onClose={() => setShowRejectModal(false)} />}
        </AdminLayout>
    );
}
