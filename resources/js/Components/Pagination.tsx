import React from "react";
import { router } from "@inertiajs/react";

interface PaginatorLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatorMeta {
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginatorLink[];
}

interface Props {
    data: PaginatorMeta;
    preserveFilters?: Record<string, string>;
}

export default function Pagination({ data, preserveFilters = {} }: Props) {
    if (data.last_page <= 1) return null;

    const goTo = (url: string | null) => {
        if (!url) return;
        const pageNum = new URL(url).searchParams.get("page");
        if (!pageNum) return;
        router.get(
            window.location.pathname,
            { ...preserveFilters, page: pageNum },
            { preserveState: true, replace: true }
        );
    };

    const btnBase: React.CSSProperties = {
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: "32px", height: "32px", padding: "0 8px",
        fontSize: "9px", fontWeight: 900, textTransform: "uppercase",
        letterSpacing: "0.1em", border: "1px solid #e5e7eb",
        backgroundColor: "#fff", color: "rgba(45,50,62,0.5)",
        cursor: "pointer", fontFamily: "inherit", transition: "all 0.1s",
    };

    const btnActive: React.CSSProperties = {
        ...btnBase,
        backgroundColor: "#0A0A0A", color: "#fff",
        borderColor: "#0A0A0A",
    };

    const btnDisabled: React.CSSProperties = {
        ...btnBase,
        opacity: 0.3, cursor: "not-allowed",
    };

    // Filter out the "prev" and "next" labels — render them separately
    const pageLinks = data.links.filter(l =>
        !l.label.includes("Previous") && !l.label.includes("Next")
    );
    const prevLink = data.links.find(l => l.label.includes("Previous"));
    const nextLink = data.links.find(l => l.label.includes("Next"));

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px" }}>
            {/* Result count */}
            <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.3)" }}>
                {data.from ?? 0}–{data.to ?? 0} of {data.total}
            </p>

            {/* Page buttons */}
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {/* Prev */}
                <button
                    onClick={() => goTo(prevLink?.url ?? null)}
                    disabled={!prevLink?.url}
                    style={prevLink?.url ? btnBase : btnDisabled}
                >
                    ←
                </button>

                {/* Page numbers */}
                {pageLinks.map((link, i) => {
                    if (link.label === "...") {
                        return (
                            <span key={i} style={{ ...btnBase, cursor: "default", border: "none" }}>…</span>
                        );
                    }
                    return (
                        <button
                            key={i}
                            onClick={() => goTo(link.url)}
                            disabled={!link.url}
                            style={link.active ? btnActive : btnBase}
                        >
                            {link.label}
                        </button>
                    );
                })}

                {/* Next */}
                <button
                    onClick={() => goTo(nextLink?.url ?? null)}
                    disabled={!nextLink?.url}
                    style={nextLink?.url ? btnBase : btnDisabled}
                >
                    →
                </button>
            </div>
        </div>
    );
}
