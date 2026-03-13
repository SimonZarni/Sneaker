import React from "react";
import { Link } from "@inertiajs/react";

type ActivePage = "dashboard" | "orders" | "products" | "settings";

export default function AdminLayout({
    children,
    adminName,
    active,
    pageTitle,
    pageLabel,
    headerRight,
}: {
    children: React.ReactNode;
    adminName: string;
    active: ActivePage;
    pageTitle: string;
    pageLabel: string;
    headerRight?: React.ReactNode;
}) {
    const navItems: { key: ActivePage; label: string; href: string; icon: React.ReactNode }[] = [
        {
            key: "dashboard",
            label: "Dashboard",
            href: route("admin.dashboard"),
            icon: (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ opacity: 0.6, flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
            ),
        },
        {
            key: "orders",
            label: "Orders",
            href: route("admin.orders.index"),
            icon: (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ opacity: 0.6, flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
        },
        {
            key: "products",
            label: "Products",
            href: route("admin.products.index"),
            icon: (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ opacity: 0.6, flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
            ),
        },
        {
            key: "settings",
            label: "Settings",
            href: route("admin.settings.index"),
            icon: (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ opacity: 0.6, flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8F8F8", fontFamily: "inherit" }}>

            {/* ── SIDEBAR ── */}
            <aside style={{
                position: "fixed", left: 0, top: 0, height: "100%", width: "224px",
                backgroundColor: "#0A0A0A", color: "#fff", display: "flex",
                flexDirection: "column", zIndex: 50,
            }}>
                <div style={{ padding: "32px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>
                        Admin Panel
                    </p>
                    <h1 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em" }}>
                        SNEAKER.DRP
                    </h1>
                </div>

                <nav style={{ flex: 1, padding: "24px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {navItems.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            style={{
                                display: "flex", alignItems: "center", gap: "12px",
                                padding: "12px 16px", fontSize: "10px", fontWeight: 900,
                                textTransform: "uppercase", letterSpacing: "0.1em", borderRadius: "2px",
                                textDecoration: "none", transition: "all 0.15s",
                                backgroundColor: active === item.key ? "rgba(255,255,255,0.1)" : "transparent",
                                color: active === item.key ? "#fff" : "rgba(255,255,255,0.5)",
                            }}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <p style={{ padding: "0 16px", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {adminName}
                    </p>
                    <Link
                        href={route("admin.logout")}
                        method="post"
                        as="button"
                        style={{
                            width: "100%", display: "flex", alignItems: "center", gap: "12px",
                            padding: "8px 16px", fontSize: "10px", fontWeight: 900,
                            textTransform: "uppercase", letterSpacing: "0.1em",
                            color: "rgba(255,255,255,0.4)", background: "none",
                            border: "none", cursor: "pointer", textAlign: "left",
                        }}
                    >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        Sign Out
                    </Link>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <div style={{ marginLeft: "224px", flex: 1, display: "flex", flexDirection: "column" }}>
                <header style={{
                    backgroundColor: "#fff", borderBottom: "1px solid #f0f0f0",
                    padding: "24px 40px", display: "flex", alignItems: "center",
                    justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40,
                }}>
                    <div>
                        <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(45,50,62,0.4)", marginBottom: "2px" }}>
                            {pageLabel}
                        </p>
                        <h2 style={{ fontSize: "22px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.05em" }}>
                            {pageTitle}
                        </h2>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {headerRight}
                        <Link
                            href="/"
                            target="_blank"
                            style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(45,50,62,0.4)", textDecoration: "none", borderBottom: "1px solid currentColor", paddingBottom: "1px" }}
                        >
                            View Store ↗
                        </Link>
                    </div>
                </header>

                <main style={{ padding: "32px 40px", flex: 1 }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
