import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Components/AdminLayout";
import Pagination from "@/Components/Pagination";

interface Review {
    id: number;
    rating: number;
    title: string | null;
    body: string | null;
    user_name: string;
    product_id: number;
    product_name: string;
    created_at: string;
}

interface PaginatedReviews {
    data: Review[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: any[];
}

interface Props {
    reviews: PaginatedReviews;
    stats: { total: number };
    admin: { name: string };
    filters?: { search?: string };
}

function StarRow({ rating }: { rating: number }) {
    return (
        <div style={{ display: "flex", gap: "2px" }}>
            {[1,2,3,4,5].map(s => (
                <svg key={s} width="12" height="12" viewBox="0 0 24 24"
                    fill={s <= rating ? "#0A0A0A" : "none"}
                    stroke="#0A0A0A" strokeWidth="1.5"
                    style={{ opacity: s <= rating ? 1 : 0.2 }}
                >
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
            ))}
        </div>
    );
}

export default function AdminReviewsIndex({ reviews, stats, admin, filters }: Props) {
    const [search, setSearch] = useState(filters?.search ?? "");

    const applySearch = () => {
        router.get(route("admin.reviews.index"), { search }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearSearch = () => {
        setSearch("");
        router.get(route("admin.reviews.index"), {}, { preserveState: false, replace: true });
    };

    const handleDelete = (id: number) => {
        if (!confirm("Delete this review? This cannot be undone.")) return;
        router.delete(route("admin.reviews.reject", id), { preserveScroll: true });
    };

    return (
        <AdminLayout
            adminName={admin.name}
            active="reviews"
            pageTitle="Reviews"
            pageLabel="Customer Reviews"
            headerRight={
                <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "24px", fontWeight: 900, color: "#0A0A0A", lineHeight: 1 }}>{stats.total}</p>
                    <p style={{ fontSize: "7px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(45,50,62,0.3)", marginTop: "2px" }}>Total Reviews</p>
                </div>
            }
        >
            <Head title="Reviews — Admin" />

            {/* Search — server-side since we paginate */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") applySearch(); }}
                    placeholder="Search by product, user, or title..."
                    style={{ width: "100%", maxWidth: "400px", border: "1px solid #e5e7eb", padding: "8px 14px", fontSize: "11px", fontWeight: 500, outline: "none", fontFamily: "inherit" }}
                />
                <button
                    onClick={applySearch}
                    style={{ padding: "8px 18px", backgroundColor: "#0A0A0A", color: "#fff", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", border: "none", cursor: "pointer" }}
                >
                    Search
                </button>
                {filters?.search && (
                    <button
                        onClick={clearSearch}
                        style={{ padding: "8px 14px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer" }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* List */}
            {reviews.data.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(45,50,62,0.2)" }}>
                    <p style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em" }}>
                        {filters?.search ? "No reviews match your search" : "No reviews yet"}
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "#f0f0f0", border: "1px solid #f0f0f0" }}>
                        {reviews.data.map(review => (
                            <ReviewRow key={review.id} review={review} onDelete={() => handleDelete(review.id)} />
                        ))}
                    </div>
                    <Pagination data={reviews} preserveFilters={{ search }} />
                </>
            )}
        </AdminLayout>
    );
}

function ReviewRow({ review, onDelete }: { review: Review; onDelete: () => void }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div style={{ backgroundColor: "#fff", padding: "18px 24px", display: "flex", alignItems: "flex-start", gap: "20px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px", flexWrap: "wrap" as const }}>
                    <StarRow rating={review.rating} />
                    <span style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "rgba(45,50,62,0.5)" }}>
                        {review.user_name}
                    </span>
                    <span style={{ fontSize: "8px", color: "rgba(45,50,62,0.25)", fontWeight: 600 }}>
                        {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                    </span>
                </div>

                <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(45,50,62,0.4)", marginBottom: "6px" }}>
                    on{" "}
                    <Link href={route("shop.show", review.product_id)} style={{ color: "#0A0A0A", textDecoration: "none", borderBottom: "1px solid #0A0A0A" }}>
                        {review.product_name}
                    </Link>
                </p>

                {review.title && (
                    <p style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "-0.01em", marginBottom: "4px" }}>
                        {review.title}
                    </p>
                )}

                {review.body && (
                    <p style={{ fontSize: "11px", color: "rgba(45,50,62,0.6)", lineHeight: 1.7, fontWeight: 500 }}>
                        {expanded || review.body.length <= 160 ? review.body : review.body.slice(0, 160) + "..."}
                        {review.body.length > 160 && (
                            <button onClick={() => setExpanded(v => !v)} style={{ marginLeft: "6px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", background: "none", border: "none", borderBottom: "1px solid #0A0A0A", cursor: "pointer", color: "#0A0A0A", padding: 0 }}>
                                {expanded ? "Less" : "More"}
                            </button>
                        )}
                    </p>
                )}
            </div>

            <button onClick={onDelete} style={{ padding: "6px 16px", backgroundColor: "#fef2f2", color: "#dc2626", fontSize: "8px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.1em", border: "1px solid #fecaca", cursor: "pointer", flexShrink: 0 }}>
                ✕ Delete
            </button>
        </div>
    );
}
