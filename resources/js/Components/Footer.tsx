import React from "react";
import { Link } from "@inertiajs/react";

export default function Footer() {
    return (
        <footer className="bg-brand-charcoal text-brand-white">

            {/* ── Main grid ── */}
            <div className="mx-auto max-w-7xl px-4 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-16">

                    {/* Brand column */}
                    <div className="space-y-6">
                        <Link href="/" className="text-2xl font-black tracking-tightest uppercase text-white">
                            SNEAKER.DRP
                        </Link>
                        <p className="text-[10px] font-medium leading-loose text-white/40 max-w-xs">
                            Curated drops from the world's most coveted sneaker brands. Every pair verified authentic before it reaches your vault.
                        </p>
                        {/* Social icons */}
                        <div className="flex items-center gap-4 pt-2">
                            {[
                                { label: "Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
                                { label: "Twitter/X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                                { label: "TikTok", path: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.78a4.85 4.85 0 01-1.07-.09z" },
                            ].map(s => (
                                <a key={s.label} href="#" aria-label={s.label}
                                    className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d={s.path} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Shop column */}
                    <div className="space-y-6">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30">
                            Shop
                        </p>
                        <ul className="space-y-4">
                            {[
                                { label: "All Drops",   href: route("shop.index") },
                                { label: "New Arrivals", href: route("shop.index") + "?sort=latest" },
                                { label: "Wishlist",    href: route("wishlist.index") },
                                { label: "My Orders",   href: route("orders.index") },
                            ].map(item => (
                                <li key={item.label}>
                                    <Link href={item.href}
                                        className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Account column */}
                    <div className="space-y-6">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30">
                            Account
                        </p>
                        <ul className="space-y-4">
                            {[
                                { label: "Sign In",     href: route("login") },
                                { label: "Register",    href: route("register") },
                                { label: "My Profile",  href: route("profile.edit") },
                                { label: "Order History", href: route("orders.index") },
                            ].map(item => (
                                <li key={item.label}>
                                    <Link href={item.href}
                                        className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Help column */}
                    <div className="space-y-6">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30">
                            Help
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Shipping & Returns",
                                "Size Guide",
                                "Authenticity Policy",
                                "Contact Us",
                                "FAQs",
                            ].map(item => (
                                <li key={item}>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 cursor-default">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-white/10" />

            {/* ── Bottom bar ── */}
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">

                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                        © 2026 SNEAKER.DRP — All Rights Reserved
                    </p>

                    {/* Payment icons */}
                    <div className="flex items-center gap-3">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-white/20 mr-2">
                            We Accept
                        </span>
                        {["VISA", "MC", "AMEX", "COD"].map(method => (
                            <span key={method}
                                className="px-2.5 py-1 border border-white/10 text-[7px] font-black uppercase tracking-widest text-white/25">
                                {method}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        {["Privacy Policy", "Terms of Use"].map(item => (
                            <span key={item}
                                className="text-[8px] font-bold uppercase tracking-widest text-white/20 cursor-default">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
