import { Head, Link, usePage } from "@inertiajs/react";
import React, { useState } from "react";
import CartDrawer from "@/Components/CartDrawer";
import Footer from "@/Components/Footer";

export default function Home({ featured }: any) {
    const { navigation, cart, auth }: any = usePage().props;
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const cartCount =
        cart?.items?.reduce(
            (acc: number, item: any) => acc + item.quantity,
            0,
        ) || 0;

    return (
        <div className="min-h-screen bg-white text-brand-charcoal antialiased">
            <Head title="Walker Sneaker Store — Home" />

            {/* ── NAVBAR ── */}
            <nav className="fixed top-0 w-full z-50 bg-brand-charcoal shadow-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <Link href="/" className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
                        Walker Sneaker Store
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href={route("home")} className="text-white text-sm font-medium hover:text-white/70 transition-colors">
                            Home
                        </Link>
                        <Link href={route("about")} className="text-white text-sm font-medium hover:text-white/70 transition-colors">
                            About
                        </Link>
                        <Link href={route("shop.index")} className="text-white text-sm font-medium hover:text-white/70 transition-colors">
                            Shop
                        </Link>
                        {auth?.user ? (
                            <>
                                <Link href="/profile" className="text-white text-sm font-medium hover:text-white/70 transition-colors">
                                    {auth.user.name}
                                </Link>
                                <Link href="/logout" method="post" as="button" className="text-white text-sm font-medium hover:text-white/70 transition-colors cursor-pointer">
                                    Log Out
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" className="text-white text-sm font-medium hover:text-white/70 transition-colors">
                                Login
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href={route("shop.index")} aria-label="Search" className="text-white/80 hover:text-white transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                            </svg>
                        </Link>
                        <Link href={route("wishlist.index")} aria-label="Wishlist" className="text-white/80 hover:text-white transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        </Link>
                        <button onClick={() => setIsCartOpen(true)} aria-label="Cart" className="relative text-white/80 hover:text-white transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-white text-brand-charcoal text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        <button onClick={() => setMobileMenuOpen(v => !v)} aria-label="Toggle menu" className="md:hidden text-white/80 hover:text-white">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3 12h18M3 6h18M3 18h18"} />
                            </svg>
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden bg-brand-slate px-4 pb-4 space-y-1">
                        <Link href={route("home")} className="block text-white text-sm font-medium py-2">Home</Link>
                        <Link href={route("about")} className="block text-white text-sm font-medium py-2">About</Link>
                        <Link href={route("shop.index")} className="block text-white text-sm font-medium py-2">Shop</Link>
                        {auth?.user ? (
                            <>
                                <Link href="/profile" className="block text-white text-sm font-medium py-2">{auth.user.name}</Link>
                                <Link href="/orders" className="block text-white text-sm font-medium py-2">My Orders</Link>
                                <Link href="/logout" method="post" as="button" className="block text-white text-sm font-medium py-2 w-full text-left">Log Out</Link>
                            </>
                        ) : (
                            <Link href="/login" className="block text-white text-sm font-medium py-2">Login</Link>
                        )}
                    </div>
                )}
            </nav>

            {/* ── HERO (prototype: text left, sneaker image right) ── */}
            <section className="pt-16 min-h-[88vh] flex items-center bg-white relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-brand-surface/30 hidden lg:block" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[72vh]">
                        {/* Left: Text */}
                        <div className="space-y-6 py-16 lg:py-0">
                            <p className="text-xs font-bold uppercase tracking-[0.4em] text-brand-charcoal/50">
                                Welcome to
                            </p>
                            <h2 className="text-5xl lg:text-6xl font-black uppercase tracking-tight leading-tight text-brand-charcoal">
                                Walker <br />Sneaker Store
                            </h2>
                            <p className="text-sm font-medium leading-relaxed text-gray-500 max-w-md">
                                Walker Sneaker Store is a modern footwear retailer offering a wide range of popular sneaker brands
                                and stylish urban footwear. The store focuses on delivering high-quality, trendy products that appeal
                                to sneaker enthusiasts and everyday customers alike. With a customer-friendly shopping experience
                                and reliable service, Walker has become a trusted destination for fashionable, authentic sneakers.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <Link
                                    href={route("shop.index")}
                                    className="inline-block bg-brand-charcoal text-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-brand-slate transition-colors"
                                >
                                    Shop Now
                                </Link>
                                <Link
                                    href={route("about")}
                                    className="inline-block border-2 border-brand-charcoal text-brand-charcoal px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-brand-surface transition-colors"
                                >
                                    About Us
                                </Link>
                            </div>
                        </div>

                        {/* Right: Sneaker Image */}
                        <div className="relative flex items-center justify-center py-8 lg:py-0">
                            <div className="absolute w-80 h-80 lg:w-[420px] lg:h-[420px] rounded-full bg-brand-charcoal/6" />
                            <img
                                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop"
                                alt="Featured Sneaker"
                                className="relative z-10 w-full max-w-md object-contain drop-shadow-2xl"
                                style={{ transform: "rotate(-6deg) translateY(-8px)" }}
                            />
                            <div className="absolute top-8 right-0 lg:right-4 bg-brand-charcoal text-white px-4 py-2 shadow-lg z-20">
                                <p className="text-[8px] font-black uppercase tracking-widest text-white/60">New Season</p>
                                <p className="text-xs font-black uppercase">2026 Drop</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── BRAND STRIP ── */}
            <section className="py-16 bg-white border-t border-b border-gray-100">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="text-center mb-8">
                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 mb-3">Our Brands</p>
                        <p className="text-sm text-gray-400 max-w-xl mx-auto">
                            Walker Sneaker Store carries a diverse range of trusted global brands, offering customers both sporty and casual lifestyle options. These brands provide high-quality footwear and apparel.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 border border-gray-100">
                        {navigation.brands.map((brand: any) => (
                            <Link
                                key={brand.id}
                                href={`/shop?brand=${brand.id}`}
                                className="group flex flex-col items-center justify-center py-10 px-6 bg-white hover:bg-brand-surface/40 transition-colors gap-3"
                            >
                                {brand.logo_url ? (
                                    <img
                                        src={brand.logo_url}
                                        alt={brand.name}
                                        className="h-10 w-auto object-contain opacity-25 group-hover:opacity-80 transition-opacity duration-300 grayscale group-hover:grayscale-0"
                                    />
                                ) : (
                                    <span className="text-2xl font-black uppercase tracking-tightest text-gray-200 group-hover:text-brand-charcoal transition-colors duration-300">
                                        {brand.name}
                                    </span>
                                )}
                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300 group-hover:text-brand-charcoal/60 transition-colors">
                                    {brand.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURED PRODUCTS ── */}
            <section className="py-20 bg-brand-surface/20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-charcoal/40 mb-2">Hand-picked</p>
                            <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Featured Selection</h3>
                        </div>
                        <Link
                            href="/shop"
                            className="text-xs font-bold uppercase tracking-widest text-brand-charcoal border-b-2 border-brand-charcoal pb-0.5 hover:text-brand-slate hover:border-brand-slate transition-all"
                        >
                            View All →
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {featured.map((product: any) => (
                            <div
                                key={product.id}
                                className="bg-white overflow-hidden group shadow-sm hover:shadow-md transition-shadow relative border border-gray-100"
                            >
                                <Link href={`/shop/${product.id}`} className="absolute inset-0 z-10" />
                                <div className="aspect-square bg-gray-50 overflow-hidden">
                                    <img
                                        src={product.main_image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="p-4">
                                    <p className="text-[9px] font-bold text-brand-charcoal/50 uppercase tracking-widest mb-1">
                                        {product.brand?.name}
                                    </p>
                                    <h4 className="text-sm font-bold tracking-tight truncate">{product.name}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className={`text-sm font-black ${(product as any).is_on_sale ? "text-brand-charcoal" : "text-gray-800"}`}>
                                            ${parseFloat((product as any).effective_price ?? product.base_price).toFixed(2)}
                                        </p>
                                        {(product as any).is_on_sale && (
                                            <p className="text-xs text-gray-400 line-through">
                                                ${parseFloat(product.base_price).toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TRUST BAR ── */}
            <section className="py-12 bg-white border-t border-b border-gray-100">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                        {[
                            { icon: "🚚", title: "Free Shipping", body: "On all orders. No minimums." },
                            { icon: "✅", title: "100% Authentic", body: "Every pair verified by experts." },
                            { icon: "↩", title: "Easy Returns", body: "30-day hassle-free returns." },
                            { icon: "🔒", title: "Secure Checkout", body: "Encrypted payments always." },
                        ].map(item => (
                            <div key={item.title} className="flex flex-col items-center space-y-2">
                                <span className="text-2xl">{item.icon}</span>
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal">{item.title}</p>
                                <p className="text-[10px] text-gray-400 leading-relaxed">{item.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <Footer />
        </div>
    );
}
