import React from "react";
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Kpis {
    revenue: number;
    orders: number;
    aov: number;
    units_sold: number;
    cancellation_rate: number;
    shipping_revenue: number;
    new_customers: number;
}

interface ChartPoint {
    label: string;
    revenue: number;
    orders: number;
}

interface DimRow {
    name: string;
    revenue: number;
    units: number;
    orders: number;
}

interface UnitRow {
    name: string;
    units: number;
    revenue: number;
}

interface Customer {
    user_id: number;
    name: string;
    email: string;
    order_count: number;
    total_revenue: number;
    last_order_at: string;
}

interface PaymentRow {
    method: string;
    orders: number;
    revenue: number;
}

interface DowRow {
    day: string;
    orders: number;
    revenue: number;
}

interface GrowthRow {
    label: string;
    revenue: number;
    orders: number;
    change_pct: number | null;
    is_current: boolean;
}

interface Props {
    period: string;
    kpis: Kpis;
    revenueChart: ChartPoint[];
    byCategory: DimRow[];
    byBrand: DimRow[];
    byGender: DimRow[];
    bySize: UnitRow[];
    byColor: UnitRow[];
    topCustomers: Customer[];
    byPayment: PaymentRow[];
    byDayOfWeek: DowRow[];
    monthlyGrowth: GrowthRow[];
    admin: { name: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number) {
    return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        timeZone: "Asia/Bangkok",
    });
}

const PERIODS = [
    { key: "30d",  label: "Last 30 Days" },
    { key: "3m",   label: "3 Months"     },
    { key: "6m",   label: "6 Months"     },
    { key: "12m",  label: "12 Months"    },
    { key: "ytd",  label: "Year to Date" },
];

// ── Reusable bar chart ────────────────────────────────────────────────────────

function BarChart({ data, height = 120 }: { data: ChartPoint[]; height?: number }) {
    const maxRev = Math.max(...data.map(d => d.revenue), 1);
    const showEvery = data.length > 14 ? Math.ceil(data.length / 10) : 1;
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: `${height + 28}px`, paddingBottom: "28px", position: "relative" }}>
            {data.map((d, i) => {
                const barH = d.revenue > 0 ? Math.max((d.revenue / maxRev) * height, 4) : 2;
                const isLast = i === data.length - 1;
                const showLabel = i === 0 || isLast || i % showEvery === 0;
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", height: "100%" }}>
                        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                            <div
                                title={`${d.label}: ${fmt(d.revenue)} (${d.orders} order${d.orders !== 1 ? "s" : ""})`}
                                style={{
                                    width: "100%", height: `${barH}px`,
                                    backgroundColor: d.revenue === 0 ? "#f5f5f5" : isLast ? "#0A0A0A" : "#2D323E",
                                    opacity: d.revenue === 0 ? 1 : isLast ? 1 : 0.55 + (i / data.length) * 0.45,
                                    cursor: "default",
                                }}
                            />
                        </div>
                        {showLabel && (
                            <span style={{
                                fontSize: "7px", fontWeight: 700, color: "rgba(45,50,62,0.3)",
                                textTransform: "uppercase", whiteSpace: "nowrap",
                                position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                            }}>
                                {d.label}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Horizontal bar row ────────────────────────────────────────────────────────

function HBar({ label, value, max, sub }: { label: string; value: number; max: number; sub?: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 100px", gap: "12px", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
            </p>
            <div style={{ height: "6px", backgroundColor: "#f5f5f5", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, backgroundColor: "#0A0A0A", transition: "width 0.5s ease" }} />
            </div>
            <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "12px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{fmt(value)}</p>
                {sub && <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(45,50,62,0.4)", marginTop: "1px" }}>{sub}</p>}
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Analytics({
    period, kpis, revenueChart, byCategory, byBrand, byGender,
    bySize, byColor, topCustomers, byPayment, byDayOfWeek, monthlyGrowth, admin,
}: Props) {

    const periodLabel = PERIODS.find(p => p.key === period)?.label ?? "Last 30 Days";

    const chartTotal  = revenueChart.reduce((s, d) => s + d.revenue, 0);
    const chartOrders = revenueChart.reduce((s, d) => s + d.orders,  0);
    const chartPeak   = Math.max(...revenueChart.map(d => d.revenue));

    const maxCategoryRev = byCategory[0]?.revenue ?? 1;
    const maxBrandRev    = byBrand[0]?.revenue ?? 1;
    const maxGenderRev   = byGender[0]?.revenue ?? 1;
    const maxSizeUnits   = bySize[0]?.units ?? 1;
    const maxColorUnits  = byColor[0]?.units ?? 1;
    const maxDowOrders   = Math.max(...byDayOfWeek.map(d => d.orders), 1);
    const maxCustRev     = topCustomers[0]?.total_revenue ?? 1;

    const totalPayRev   = byPayment.reduce((s, p) => s + p.revenue, 0);

    return (
        <AdminLayout adminName={admin.name} active="analytics" pageTitle="Analytics" pageLabel="Sales Intelligence">
            <Head title="Analytics — SNEAKER.DRP" />

            {/* ── PERIOD FILTER ── */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "24px", flexWrap: "wrap" }}>
                {PERIODS.map(p => (
                    <Link
                        key={p.key}
                        href={route("admin.analytics.index", { period: p.key })}
                        style={{
                            padding: "8px 16px", fontSize: "9px", fontWeight: 900,
                            textTransform: "uppercase", letterSpacing: "0.15em",
                            textDecoration: "none", border: "1px solid",
                            borderColor: period === p.key ? "#0A0A0A" : "#e5e7eb",
                            backgroundColor: period === p.key ? "#0A0A0A" : "#fff",
                            color: period === p.key ? "#fff" : "rgba(45,50,62,0.5)",
                        }}
                    >
                        {p.label}
                    </Link>
                ))}
            </div>

            {/* ── KPI CARDS ── */}
            <div className="analytics-kpi-grid" style={{ gap: "12px", marginBottom: "24px" }}>

                {/* Revenue — hero card */}
                <div className="analytics-kpi-hero" style={{ backgroundColor: "#0A0A0A", color: "#fff", padding: "24px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", marginBottom: "10px" }}>
                        Total Revenue
                    </p>
                    <p style={{ fontSize: "clamp(22px,5vw,30px)", fontWeight: 900, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}>
                        {fmt(kpis.revenue)}
                    </p>
                    <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.3)", marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {periodLabel}
                    </p>
                </div>

                {[
                    { label: "Avg Order Value",    value: fmt(kpis.aov),               sub: `${kpis.orders} orders` },
                    { label: "Units Sold",          value: kpis.units_sold.toLocaleString(), sub: "confirmed only" },
                    { label: "New Customers",       value: kpis.new_customers.toString(), sub: "first-time buyers" },
                    { label: "Shipping Revenue",    value: fmt(kpis.shipping_revenue),  sub: "collected fees" },
                    { label: "Cancellation Rate",   value: `${kpis.cancellation_rate}%`, sub: "of all orders" },
                ].map(card => (
                    <div key={card.label} style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "20px" }}>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.4)", marginBottom: "10px" }}>
                            {card.label}
                        </p>
                        <p style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
                            {card.value}
                        </p>
                        <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(45,50,62,0.3)", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            {card.sub}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── REVENUE TREND CHART ── */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "28px 32px", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "2px" }}>
                            {periodLabel}
                        </p>
                        <h3 style={{ fontSize: "15px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                            Revenue Trend
                        </h3>
                    </div>
                    <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(45,50,62,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Confirmed orders only
                    </p>
                </div>

                <BarChart data={revenueChart} height={130} />

                <div style={{ display: "flex", gap: "32px", paddingTop: "16px", borderTop: "1px solid #f5f5f5", marginTop: "4px" }}>
                    {[
                        { label: "Period Total",  val: fmt(chartTotal) },
                        { label: "Orders",        val: chartOrders.toString() },
                        { label: "Peak",          val: fmt(chartPeak) },
                    ].map(s => (
                        <div key={s.label}>
                            <p style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.35)", marginBottom: "3px" }}>{s.label}</p>
                            <p style={{ fontSize: "14px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{s.val}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── CATEGORY + BRAND ── */}
            <div className="analytics-two-col" style={{ gap: "16px", marginBottom: "24px" }}>

                {/* By Category */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 28px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "2px" }}>Breakdown</p>
                    <h3 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "20px" }}>By Category</h3>
                    {byCategory.length === 0 ? (
                        <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(45,50,62,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>No data</p>
                    ) : byCategory.map(r => (
                        <HBar key={r.name} label={r.name} value={r.revenue} max={maxCategoryRev} sub={`${r.units} units · ${r.orders} orders`} />
                    ))}
                </div>

                {/* By Brand */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 28px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "2px" }}>Breakdown</p>
                    <h3 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "20px" }}>By Brand</h3>
                    {byBrand.length === 0 ? (
                        <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(45,50,62,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>No data</p>
                    ) : byBrand.map(r => (
                        <HBar key={r.name} label={r.name} value={r.revenue} max={maxBrandRev} sub={`${r.units} units`} />
                    ))}
                </div>
            </div>

            {/* ── GENDER + PAYMENT METHOD ── */}
            <div className="analytics-two-col" style={{ gap: "16px", marginBottom: "24px" }}>

                {/* By Gender */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 28px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "2px" }}>Breakdown</p>
                    <h3 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "20px" }}>By Gender</h3>
                    {byGender.length === 0 ? (
                        <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(45,50,62,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>No data</p>
                    ) : byGender.map(r => (
                        <HBar key={r.name} label={r.name} value={r.revenue} max={maxGenderRev} sub={`${r.units} units`} />
                    ))}
                </div>

                {/* By Payment Method */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 28px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "2px" }}>Breakdown</p>
                    <h3 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "20px" }}>By Payment Method</h3>
                    {byPayment.length === 0 ? (
                        <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(45,50,62,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>No data</p>
                    ) : (
                        <>
                            {byPayment.map(r => (
                                <HBar key={r.method} label={r.method} value={r.revenue} max={totalPayRev} sub={`${r.orders} orders · ${totalPayRev > 0 ? Math.round((r.revenue / totalPayRev) * 100) : 0}%`} />
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* ── SIZE + COLOR ── */}
            <div className="analytics-two-col" style={{ gap: "16px", marginBottom: "24px" }}>

                {/* By Size */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 28px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "2px" }}>Popularity</p>
                    <h3 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "20px" }}>Top Sizes</h3>
                    {bySize.length === 0 ? (
                        <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(45,50,62,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>No data</p>
                    ) : bySize.map((r, i) => {
                        const pct = maxSizeUnits > 0 ? (r.units / maxSizeUnits) * 100 : 0;
                        return (
                            <div key={r.name} style={{ display: "grid", gridTemplateColumns: "40px 1fr 60px", gap: "12px", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                                <span style={{ fontSize: "11px", fontWeight: 900, color: i === 0 ? "#0A0A0A" : "rgba(45,50,62,0.35)" }}>
                                    US {r.name}
                                </span>
                                <div style={{ height: "6px", backgroundColor: "#f5f5f5" }}>
                                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: i === 0 ? "#0A0A0A" : "#d1d5db", transition: "width 0.5s ease" }} />
                                </div>
                                <p style={{ fontSize: "11px", fontWeight: 900, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                                    {r.units} <span style={{ fontSize: "8px", fontWeight: 700, color: "rgba(45,50,62,0.35)" }}>units</span>
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* By Color */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 28px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "2px" }}>Popularity</p>
                    <h3 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "20px" }}>Top Colors</h3>
                    {byColor.length === 0 ? (
                        <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(45,50,62,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>No data</p>
                    ) : byColor.map((r, i) => {
                        const pct = maxColorUnits > 0 ? (r.units / maxColorUnits) * 100 : 0;
                        return (
                            <div key={r.name} style={{ display: "grid", gridTemplateColumns: "120px 1fr 60px", gap: "12px", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: i === 0 ? "#0A0A0A" : "rgba(45,50,62,0.6)" }}>
                                    {r.name}
                                </span>
                                <div style={{ height: "6px", backgroundColor: "#f5f5f5" }}>
                                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: i === 0 ? "#0A0A0A" : "#d1d5db", transition: "width 0.5s ease" }} />
                                </div>
                                <p style={{ fontSize: "11px", fontWeight: 900, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                                    {r.units} <span style={{ fontSize: "8px", fontWeight: 700, color: "rgba(45,50,62,0.35)" }}>units</span>
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── TOP CUSTOMERS ── */}
            <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", marginBottom: "24px" }}>
                <div style={{ padding: "20px 28px", borderBottom: "1px solid #f5f5f5" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "2px" }}>
                        Customer Intelligence
                    </p>
                    <h3 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                        Top Customers
                    </h3>
                </div>

                {topCustomers.length === 0 ? (
                    <div style={{ padding: "48px 28px", textAlign: "center", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.2)" }}>
                        No data for this period
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        {/* Header */}
                        <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 70px 70px 110px", gap: "12px", padding: "10px 20px", backgroundColor: "#fafafa", borderBottom: "1px solid #f5f5f5", minWidth: "520px" }}>
                            {["#", "Customer", "Email", "Orders", "Last Order", "Revenue"].map(h => (
                                <p key={h} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.25)" }}>{h}</p>
                            ))}
                        </div>
                        {topCustomers.map((c, i) => {
                            const barPct = maxCustRev > 0 ? (c.total_revenue / maxCustRev) * 100 : 0;
                            return (
                                <Link
                                    key={c.user_id}
                                    href={route("admin.customers.show", c.user_id)}
                                    style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 70px 70px 110px", gap: "12px", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #fafafa", textDecoration: "none", color: "inherit", minWidth: "520px" }}
                                >
                                    <span style={{ fontSize: "11px", fontWeight: 900, color: i === 0 ? "#0A0A0A" : "rgba(45,50,62,0.3)" }}>{i + 1}</span>
                                    <div>
                                        <p style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {c.name}
                                        </p>
                                        <div style={{ height: "3px", backgroundColor: "#f5f5f5" }}>
                                            <div style={{ height: "100%", width: `${barPct}%`, backgroundColor: i === 0 ? "#0A0A0A" : "#d1d5db" }} />
                                        </div>
                                    </div>
                                    <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(45,50,62,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</p>
                                    <p style={{ fontSize: "12px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{c.order_count}</p>
                                    <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(45,50,62,0.5)" }}>{fmtDate(c.last_order_at)}</p>
                                    <p style={{ fontSize: "13px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{fmt(c.total_revenue)}</p>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── PEAK DAY OF WEEK + MONTHLY GROWTH ── */}
            <div className="analytics-two-col" style={{ gap: "16px", marginBottom: "24px" }}>

                {/* Peak day of week */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 28px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "2px" }}>Order Patterns</p>
                    <h3 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "20px" }}>Peak Day of Week</h3>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "100px" }}>
                        {byDayOfWeek.map(d => {
                            const barH = d.orders > 0 ? Math.max((d.orders / maxDowOrders) * 80, 4) : 2;
                            const isPeak = d.orders === maxDowOrders && maxDowOrders > 0;
                            return (
                                <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
                                    <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                                        <div
                                            title={`${d.day}: ${d.orders} orders · ${fmt(d.revenue)}`}
                                            style={{
                                                width: "100%", height: `${barH}px`,
                                                backgroundColor: isPeak ? "#0A0A0A" : "#e5e7eb",
                                                cursor: "default",
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", color: isPeak ? "#0A0A0A" : "rgba(45,50,62,0.35)" }}>
                                        {d.day}
                                    </span>
                                    <span style={{ fontSize: "9px", fontWeight: 900, fontVariantNumeric: "tabular-nums", color: "rgba(45,50,62,0.5)" }}>
                                        {d.orders}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 12-month growth table */}
                <div style={{ backgroundColor: "#fff", border: "1px solid #f0f0f0", padding: "24px 28px" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.3)", marginBottom: "2px" }}>12-Month View</p>
                    <h3 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "16px" }}>Monthly Growth</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                        {/* Header */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 60px 60px", gap: "8px", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                            {["Month", "Revenue", "Orders", "Δ %"].map(h => (
                                <p key={h} style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(45,50,62,0.25)" }}>{h}</p>
                            ))}
                        </div>
                        {monthlyGrowth.map(m => (
                            <div key={m.label} style={{ display: "grid", gridTemplateColumns: "1fr 90px 60px 60px", gap: "8px", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #fafafa" }}>
                                <p style={{ fontSize: "10px", fontWeight: m.is_current ? 900 : 600, color: m.is_current ? "#0A0A0A" : "rgba(45,50,62,0.55)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    {m.label}
                                    {m.is_current && <span style={{ fontSize: "7px", fontWeight: 900, color: "rgba(45,50,62,0.3)", marginLeft: "5px", letterSpacing: "0.1em" }}>MTD</span>}
                                </p>
                                <p style={{ fontSize: "11px", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{fmt(m.revenue)}</p>
                                <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(45,50,62,0.5)", fontVariantNumeric: "tabular-nums" }}>{m.orders}</p>
                                <p style={{
                                    fontSize: "10px", fontWeight: 900, fontVariantNumeric: "tabular-nums",
                                    color: m.change_pct === null ? "rgba(45,50,62,0.2)"
                                        : m.change_pct >= 0 ? "#065f46" : "#dc2626",
                                }}>
                                    {m.change_pct === null ? "—"
                                        : `${m.change_pct >= 0 ? "+" : ""}${m.change_pct}%`}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RESPONSIVE STYLES ── */}
            <style>{`
                .analytics-kpi-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                }
                .analytics-kpi-hero { grid-column: 1 / -1; }

                @media (min-width: 640px) {
                    .analytics-kpi-grid { grid-template-columns: 1fr 1fr; }
                    .analytics-kpi-hero { grid-column: 1 / -1; }
                }
                @media (min-width: 1024px) {
                    .analytics-kpi-grid { grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 1fr; }
                    .analytics-kpi-hero { grid-column: span 1; }
                }

                .analytics-two-col {
                    display: grid;
                    grid-template-columns: 1fr;
                }
                @media (min-width: 768px) {
                    .analytics-two-col { grid-template-columns: 1fr 1fr; }
                }
            `}</style>
        </AdminLayout>
    );
}
