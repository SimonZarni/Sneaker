import React, { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import CartDrawer from "@/Components/CartDrawer";
import Footer from "@/Components/Footer";
import NotificationBell from "@/Components/NotificationBell";

export default function About() {
    const { auth, cart }: any = usePage().props;
    const [isCartOpen,     setIsCartOpen]     = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const cartCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title="About Us — SNEAKER.DRP" />

            {/* ── MOBILE SIDEBAR ── */}
            <div className={`fixed inset-0 z-[60] transition-all duration-300 ${mobileMenuOpen ? "visible" : "invisible"}`}>
                <div className={`absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setMobileMenuOpen(false)} />
                <div className={`absolute top-0 right-0 h-full w-72 bg-brand-white flex flex-col transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
                    <div className="flex items-center justify-between px-6 py-6 border-b border-brand-surface">
                        <span className="text-xs font-black uppercase tracking-widest">Menu</span>
                        <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:opacity-50 transition-opacity">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <nav className="flex flex-col flex-1 px-6 py-8 overflow-y-auto">
                        {[
                            { label: "The Archive", href: route("shop.index") },
                            { label: "About Us",    href: route("about") },
                        ].map(item => (
                            <Link key={item.label} href={item.href} prefetch onClick={() => setMobileMenuOpen(false)}
                                className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors text-brand-charcoal">
                                {item.label}
                            </Link>
                        ))}
                        {auth?.user ? (
                            <>
                                <Link href="/profile" prefetch onClick={() => setMobileMenuOpen(false)}
                                    className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors">
                                    {auth.user.name}
                                </Link>
                                <Link href="/orders" prefetch onClick={() => setMobileMenuOpen(false)}
                                    className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors">
                                    My Orders
                                </Link>
                                <Link href="/logout" method="post" as="button" onClick={() => setMobileMenuOpen(false)}
                                    className="text-left text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors cursor-pointer">
                                    Log Out
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" prefetch onClick={() => setMobileMenuOpen(false)}
                                className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors">
                                Login
                            </Link>
                        )}
                        <button onClick={() => { setMobileMenuOpen(false); setIsCartOpen(true); }}
                            className="flex items-center justify-between text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors">
                            <span>Vault</span>
                            <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px]">{cartCount}</span>
                        </button>
                    </nav>
                    <div className="px-6 py-6 border-t border-brand-surface">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-slate/30">SNEAKER.DRP © 2026</p>
                    </div>
                </div>
            </div>

            {/* ── NAV ── */}
            <nav className="fixed top-0 w-full z-50 border-b border-brand-surface bg-brand-white/95 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center py-6">
                    {/* Desktop left */}
                    <div className="flex-1 hidden lg:flex gap-6 text-[10px] font-black uppercase tracking-widest">
                        <Link href={route("shop.index")} prefetch className="hover:text-brand-slate transition-colors">The Archive</Link>
                        <Link href={route("about")} prefetch className="border-b-2 border-brand-charcoal pb-0.5">About Us</Link>
                    </div>
                    <h1 className="text-2xl font-black tracking-tightest uppercase flex-shrink-0">
                        <Link href={route("home")}>SNEAKER.DRP</Link>
                    </h1>
                    {/* Desktop right */}
                    <div className="flex-1 hidden lg:flex justify-end items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                        {auth?.user ? (
                            <>
                                <Link href="/profile" prefetch className="hover:text-brand-slate transition-colors">{auth.user.name}</Link>
                                <Link href="/orders" prefetch className="hover:text-brand-slate transition-colors">My Orders</Link>
                                <Link href="/logout" method="post" as="button" className="hover:text-brand-slate transition-colors uppercase cursor-pointer">Log Out</Link>
                                <NotificationBell userId={auth.user.id} />
                            </>
                        ) : (
                            <Link href="/login" prefetch className="hover:text-brand-slate transition-colors">Login</Link>
                        )}
                        <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-2 group">
                            <span>Vault</span>
                            <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px] group-hover:bg-brand-slate transition-colors">{cartCount}</span>
                        </button>
                    </div>
                    {/* Mobile right */}
                    <div className="flex lg:hidden items-center gap-4 ml-auto">
                        {auth?.user && <NotificationBell userId={auth.user.id} />}
                        <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                            <span>Vault</span>
                            <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px]">{cartCount}</span>
                        </button>
                        <button onClick={() => setMobileMenuOpen(true)} className="p-1 hover:opacity-50 transition-opacity" aria-label="Open menu">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="pt-32 sm:pt-40 pb-24 px-4 bg-brand-charcoal text-white">
                <div className="mx-auto max-w-7xl">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/40 mb-6">Our Story</p>
                    <h2 className="text-4xl sm:text-6xl lg:text-8xl font-black uppercase tracking-tightest leading-[0.85] max-w-3xl">
                        Built for Sneaker Culture.
                    </h2>
                    <p className="mt-10 text-base font-medium leading-loose text-white/60 max-w-xl">
                        SNEAKER.DRP is a modern footwear retailer offering a wide range of popular sneaker brands
                        and stylish urban footwear. We focus on delivering high-quality, trendy products that appeal to
                        sneaker enthusiasts and everyday customers alike.
                    </p>
                </div>
            </section>

            {/* ── MISSION SPLIT ── */}
            <section className="py-24 px-4 border-b border-brand-surface">
                <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-2 lg:gap-24 items-center">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-charcoal/40 mb-4">
                            Our Mission
                        </p>
                        <h3 className="text-4xl font-black uppercase tracking-tightest leading-tight mb-8">
                            Authentic Pairs, Every Time.
                        </h3>
                        <p className="text-sm font-medium leading-loose text-brand-slate/60 mb-6">
                            With a customer-friendly shopping experience and reliable service, Walker has become a trusted
                            destination for fashionable, authentic sneakers. Every pair in our vault is verified before
                            it ships to you — no compromises.
                        </p>
                        <p className="text-sm font-medium leading-loose text-brand-slate/60">
                            We stock the latest drops from Nike, Adidas, Jordan, New Balance, and more — curated
                            for lifestyle, performance, and everything in between.
                        </p>
                        <Link
                            href={route("shop.index")}
                            className="inline-block mt-10 bg-brand-charcoal text-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-slate transition-colors"
                        >
                            Shop The Archive →
                        </Link>
                    </div>
                    <div className="mt-16 lg:mt-0 aspect-[4/3] bg-brand-surface overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop"
                            alt="Sneakers"
                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                        />
                    </div>
                </div>
            </section>

            {/* ── VALUES ── */}
            <section className="py-24 px-4 bg-brand-surface/40 border-b border-brand-surface">
                <div className="mx-auto max-w-7xl">
                    <div className="text-center mb-16">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-charcoal/40 mb-3">
                            What We Stand For
                        </p>
                        <h3 className="text-4xl font-black uppercase tracking-tightest">Our Values</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-brand-surface border border-brand-surface overflow-hidden">
                        {[
                            {
                                icon: (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                ),
                                title: "100% Authentic",
                                body: "Every single pair is verified by our expert team before it reaches your door. No fakes, no exceptions.",
                            },
                            {
                                icon: (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                ),
                                title: "Curated Selection",
                                body: "We don't stock everything — we stock the right things. The most coveted drops, carefully selected for our community.",
                            },
                            {
                                icon: (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                                    </svg>
                                ),
                                title: "Community First",
                                body: "Walker is built for sneaker culture. We listen to our community, stock what they want, and deliver an experience they deserve.",
                            },
                        ].map(v => (
                            <div key={v.title} className="bg-brand-white p-12 flex flex-col items-start gap-6">
                                <div className="text-brand-charcoal">{v.icon}</div>
                                <h4 className="text-lg font-black uppercase tracking-tight">{v.title}</h4>
                                <p className="text-sm font-medium leading-loose text-brand-slate/60">{v.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section className="py-24 px-4 bg-brand-charcoal text-white">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10 overflow-hidden">
                        {[
                            { value: "500+",  label: "Drops Curated" },
                            { value: "4",     label: "Premium Brands" },
                            { value: "100%",  label: "Authenticated" },
                            { value: "30",    label: "Day Returns" },
                        ].map(s => (
                            <div key={s.label} className="bg-brand-charcoal px-12 py-14 text-center">
                                <p className="text-5xl font-black tracking-tightest mb-3">{s.value}</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-24 px-4 border-t border-brand-surface text-center">
                <div className="mx-auto max-w-xl">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-charcoal/30 mb-4">
                        Ready to Shop?
                    </p>
                    <h3 className="text-4xl font-black uppercase tracking-tightest mb-6">
                        Find Your Next Drop.
                    </h3>
                    <p className="text-sm font-medium text-brand-slate/50 leading-loose mb-10">
                        Browse our full archive of verified authentic sneakers from the world's most coveted brands.
                    </p>
                    <Link
                        href={route("shop.index")}
                        className="inline-block bg-brand-charcoal text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-slate transition-colors"
                    >
                        Browse The Archive →
                    </Link>
                </div>
            </section>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <Footer />
        </div>
    );
}
