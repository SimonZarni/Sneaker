import { Head, Link, usePage } from "@inertiajs/react";
import React, { useState } from "react";
import CartDrawer from "@/Components/CartDrawer";
import Footer from "@/Components/Footer";

export default function Home({ featured }: any) {
    const { navigation, cart, auth }: any = usePage().props;

    // State to track which top-level item is being hovered
    const [activeMenu, setActiveMenu] = useState<{
        type: "gender" | "brand";
        id: number;
    } | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const cartCount =
        cart?.items?.reduce(
            (acc: number, item: any) => acc + item.quantity,
            0,
        ) || 0;

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title="SNEAKER.DRP — The Vault" />

            {/* NAVIGATION WRAPPER */}
            <nav
                className="fixed top-0 w-full z-50 border-b border-brand-surface bg-brand-white/95 backdrop-blur-md"
                onMouseLeave={() => setActiveMenu(null)} // Close menu when leaving the whole nav area
            >
                {/* Tier 1: Identity & Utility */}
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center py-6">
                    <div className="flex-1 hidden lg:flex gap-6 text-[10px] font-black uppercase tracking-widest">
                        <Link
                            href="/shop"
                            className="hover:text-brand-slate transition-colors"
                        >
                            The Archive
                        </Link>
                        <Link
                            href={route("about")}
                            className="hover:text-brand-slate transition-colors"
                        >
                            About Us
                        </Link>
                    </div>

                    <h1 className="text-2xl font-black tracking-tightest uppercase flex-shrink-0">
                        <Link href="/">SNEAKER.DRP</Link>
                    </h1>
                    <div className="flex-1 flex justify-end items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                        {auth?.user ? (
                            <>
                                {/* User is Logged In */}
                                <Link
                                    href="/profile"
                                    className="hover:text-brand-slate transition-colors"
                                >
                                    {auth.user.name}
                                </Link>

                                <Link
                                    href="/orders"
                                    className="hover:text-brand-slate transition-colors"
                                >
                                    My Orders
                                </Link>

                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="hover:text-brand-slate transition-colors uppercase cursor-pointer"
                                >
                                    Log Out
                                </Link>
                            </>
                        ) : (
                            /* User is Guest */
                            <Link
                                href="/login"
                                className="hover:text-brand-slate transition-colors"
                            >
                                Login
                            </Link>
                        )}

                        {/* Vault / Cart */}
                        <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-2 group">
                            <span>Vault</span>
                            <span className="bg-brand-charcoal text-brand-white px-1.5 py-0.5 rounded-full text-[8px] group-hover:bg-brand-slate transition-colors">
                                {cartCount}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Tier 2: Discovery Taps */}
                <div className="border-t border-brand-surface relative">
                    <div className="mx-auto max-w-7xl px-4 flex justify-center gap-10 py-4">
                        {/* Genders Loop */}
                        {navigation.genders.map((gender: any) => (
                            <div
                                key={gender.id}
                                onMouseEnter={() =>
                                    setActiveMenu({
                                        type: "gender",
                                        id: gender.id,
                                    })
                                }
                                className="relative py-2"
                            >
                                <Link
                                    href={`/shop?gender=${gender.id}`}
                                    className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${activeMenu?.type === "gender" && activeMenu?.id === gender.id ? "text-brand-charcoal" : "text-brand-slate/40 hover:text-brand-charcoal"}`}
                                >
                                    {gender.name}
                                </Link>
                            </div>
                        ))}

                        <div className="w-px h-3 bg-brand-surface self-center hidden md:block"></div>

                        {/* Brands Loop */}
                        {navigation.brands.slice(0, 4).map((brand: any) => (
                            <div
                                key={brand.id}
                                onMouseEnter={() =>
                                    setActiveMenu({
                                        type: "brand",
                                        id: brand.id,
                                    })
                                }
                                className="relative py-2"
                            >
                                <Link
                                    href={`/shop?brand=${brand.id}`}
                                    className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${activeMenu?.type === "brand" && activeMenu?.id === brand.id ? "text-brand-charcoal" : "text-brand-slate/40 hover:text-brand-charcoal"}`}
                                >
                                    {brand.name}
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* MEGA MENU DROPDOWN */}
                    <div
                        className={`absolute top-full left-0 w-full bg-brand-white border-b border-brand-surface transition-all duration-500 ease-in-out overflow-hidden shadow-2xl ${activeMenu ? "max-h-[500px] opacity-100 visible" : "max-h-0 opacity-0 invisible"}`}
                    >
                        <div className="mx-auto max-w-7xl px-8 py-16 grid grid-cols-12 gap-12">
                            {/* Categories Column */}
                            <div className="col-span-3 space-y-8">
                                <div>
                                    <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/30 mb-6">
                                        Browse by Category
                                    </h4>
                                    <ul className="space-y-4">
                                        {navigation.categories.map(
                                            (category: any) => (
                                                <li key={category.id}>
                                                    <Link
                                                        href={`/shop?${activeMenu?.type}=${activeMenu?.id}&category=${category.id}`}
                                                        className="text-xs font-bold uppercase tracking-tighter hover:pl-2 transition-all block group"
                                                    >
                                                        <span className="group-hover:text-brand-slate transition-colors">
                                                            {category.name}
                                                        </span>
                                                    </Link>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            </div>

                            {/* Promotional / Visual Column */}
                            <div className="col-span-9 grid grid-cols-2 gap-8">
                                <div className="relative aspect-[16/7] bg-brand-surface overflow-hidden group">
                                    <img
                                        src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=1450&auto=format&fit=crop"
                                        className="w-full h-full object-cover grayscale opacity-60 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-1000"
                                    />
                                    <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-brand-white/40 to-transparent">
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">
                                            Seasonal Focus
                                        </p>
                                        <h5 className="text-2xl font-black uppercase tracking-tightest">
                                            Archive Performance
                                        </h5>
                                    </div>
                                </div>
                                <div className="border border-brand-surface p-8 flex flex-col justify-center items-center text-center space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-slate/30">
                                        Free Priority Shipping
                                    </p>
                                    <p className="text-xs font-bold uppercase tracking-tight leading-relaxed max-w-[200px]">
                                        Complimentary shipping on all vault
                                        secures over $250.
                                    </p>
                                    <Link
                                        href="/shop"
                                        className="text-[9px] font-black uppercase border-b border-brand-charcoal pb-1"
                                    >
                                        Shop Everything
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-48 pb-20 px-4">
                <div className="mx-auto max-w-7xl">
                    <div className="relative overflow-hidden bg-brand-surface h-[70vh] flex items-center group">
                        <div className="absolute inset-0 z-0">
                            <img
                                src="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2070&auto=format&fit=crop"
                                className="w-full h-full object-cover grayscale brightness-75 transition-transform duration-1000 group-hover:scale-105"
                                alt="Hero Sneaker"
                            />
                        </div>
                        <div className="relative z-10 p-12 lg:p-24 space-y-6 max-w-3xl">
                            <span className="text-xs font-black uppercase tracking-[0.4em] text-brand-white">
                                Season 2026 // Archive
                            </span>
                            <h2 className="text-7xl lg:text-9xl font-black text-brand-white uppercase leading-[0.85] tracking-tightest">
                                The New <br /> Standard.
                            </h2>
                            <Link
                                href="/shop"
                                className="inline-block bg-brand-white text-brand-charcoal px-10 py-4 text-xs font-black uppercase tracking-widest hover:bg-brand-charcoal hover:text-brand-white transition-all transform hover:-translate-y-1"
                            >
                                Shop the Drop
                            </Link>
                        </div>
                    </div>
                </div>
            </section>


            {/* ── BRAND STRIP ── */}
            <section className="py-0 border-b border-brand-surface">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-brand-surface">
                        {navigation.brands.map((brand: any) => (
                            <Link
                                key={brand.id}
                                href={`/shop?brand=${brand.id}`}
                                className="group flex flex-col items-center justify-center py-10 px-6 hover:bg-brand-surface/30 transition-colors gap-3"
                            >
                                {/* Logo if available, else large text */}
                                {brand.logo_url ? (
                                    <img
                                        src={brand.logo_url}
                                        alt={brand.name}
                                        className="h-10 w-auto object-contain opacity-20 group-hover:opacity-80 transition-opacity duration-300 grayscale"
                                    />
                                ) : (
                                    <span className="text-2xl font-black uppercase tracking-tightest text-brand-charcoal/15 group-hover:text-brand-charcoal transition-colors duration-300">
                                        {brand.name}
                                    </span>
                                )}
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/20 group-hover:text-brand-slate/50 transition-colors">
                                    {brand.name} →
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Grid */}
            <section className="py-20 border-t border-brand-surface">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <h3 className="text-4xl font-black uppercase tracking-tightest leading-none">
                            Featured <br /> Selection
                        </h3>
                        <Link
                            href="/shop"
                            className="text-[10px] font-black uppercase border-b-2 border-brand-charcoal pb-1 tracking-widest hover:text-brand-slate hover:border-brand-slate transition-all"
                        >
                            Explore All
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-brand-surface border border-brand-surface overflow-hidden">
                        {featured.map((product: any) => (
                            <div
                                key={product.id}
                                className="bg-brand-white p-8 group transition-colors hover:bg-brand-surface/30 relative"
                            >
                                <Link
                                    href={`/shop/${product.id}`}
                                    className="absolute inset-0 z-10"
                                />
                                <div className="aspect-square bg-brand-surface mb-6 overflow-hidden">
                                    <img
                                        src={product.main_image_url}
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-brand-slate/40 uppercase tracking-widest">
                                    {product.brand?.name}
                                </p>
                                <h4 className="text-lg font-bold uppercase tracking-tighter mt-1">
                                    {product.name}
                                </h4>
                                <div className="flex justify-between items-end mt-4">
                                    <div className="flex items-center gap-3">
                                        <p className={`text-sm font-black ${(product as any).is_on_sale ? "text-brand-charcoal" : ""}`}>
                                            ${parseFloat((product as any).effective_price ?? product.base_price).toFixed(2)}
                                        </p>
                                        {(product as any).is_on_sale && (
                                            <p className="text-xs font-medium text-brand-slate/35 line-through">
                                                ${parseFloat(product.base_price).toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        Details →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ── TRUST BAR ── */}
            <section className="py-16 border-t border-brand-surface bg-brand-charcoal">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
                        {[
                            {
                                icon: (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                    </svg>
                                ),
                                title: "Free Shipping",
                                body: "Complimentary on all orders. No minimums.",
                            },
                            {
                                icon: (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                ),
                                title: "100% Authentic",
                                body: "Every pair verified by our expert team.",
                            },
                            {
                                icon: (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                    </svg>
                                ),
                                title: "Easy Returns",
                                body: "30-day hassle-free returns on unworn pairs.",
                            },
                            {
                                icon: (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                ),
                                title: "Secure Checkout",
                                body: "Encrypted payments. Your data stays safe.",
                            },
                        ].map((item) => (
                            <div key={item.title} className="flex flex-col items-center text-center px-8 py-12 bg-brand-charcoal space-y-4">
                                <div className="text-white/30">
                                    {item.icon}
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                                    {item.title}
                                </p>
                                <p className="text-[10px] font-medium text-white/40 leading-relaxed max-w-[160px]">
                                    {item.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Branding Ticker & Footer */}
            <section className="py-24 bg-brand-surface text-brand-charcoal overflow-hidden">
                <div className="flex animate-marquee-reverse whitespace-nowrap">
                    {/* First Set */}
                    <div className="flex shrink-0">
                        {[...Array(5)].map((_, i) => (
                            <span
                                key={`a-${i}`}
                                className="text-4xl font-black uppercase tracking-tightest mx-12 opacity-10"
                            >
                                Nike / Adidas / Jordan / New Balance
                            </span>
                        ))}
                    </div>
                    {/* Second Set (Identical) */}
                    <div className="flex shrink-0">
                        {[...Array(5)].map((_, i) => (
                            <span
                                key={`b-${i}`}
                                className="text-4xl font-black uppercase tracking-tightest mx-12 opacity-10"
                            >
                                Nike / Adidas / Jordan / New Balance
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            <Footer />
        </div>
    );
}
