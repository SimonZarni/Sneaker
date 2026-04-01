import React, { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import CartDrawer from "@/Components/CartDrawer";
import Footer from "@/Components/Footer";

export default function About() {
    const { auth, cart }: any = usePage().props;
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const cartCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;

    return (
        <div className="min-h-screen bg-white text-brand-charcoal antialiased">
            <Head title="About Us — Walker Sneaker Store" />

            {/* ── NAVBAR (same green navbar as Home) ── */}
            <nav className="fixed top-0 w-full z-50 bg-brand-charcoal shadow-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <Link href="/" className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
                        Walker Sneaker Store
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href={route("home")} className="text-white text-sm font-medium hover:text-white/70 transition-colors">Home</Link>
                        <Link href={route("about")} className="text-white text-sm font-medium border-b-2 border-white/60 pb-0.5">About</Link>
                        <Link href={route("shop.index")} className="text-white text-sm font-medium hover:text-white/70 transition-colors">Shop</Link>
                        {auth?.user ? (
                            <>
                                <Link href="/profile" className="text-white text-sm font-medium hover:text-white/70 transition-colors">{auth.user.name}</Link>
                                <Link href="/logout" method="post" as="button" className="text-white text-sm font-medium hover:text-white/70 transition-colors cursor-pointer">Log Out</Link>
                            </>
                        ) : (
                            <Link href="/login" className="text-white text-sm font-medium hover:text-white/70 transition-colors">Login</Link>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
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
                                <span className="absolute -top-2 -right-2 bg-white text-brand-charcoal text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
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
                                <Link href="/logout" method="post" as="button" className="block text-white text-sm font-medium py-2 w-full text-left">Log Out</Link>
                            </>
                        ) : (
                            <Link href="/login" className="block text-white text-sm font-medium py-2">Login</Link>
                        )}
                    </div>
                )}
            </nav>

            {/* ── HERO (prototype: green card with "About Us" + illustration) ── */}
            <section className="pt-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-brand-charcoal rounded-lg overflow-hidden relative min-h-[320px] flex items-center">
                        {/* Text content */}
                        <div className="relative z-10 px-10 lg:px-16 py-12 max-w-2xl">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/50 mb-4">Walker Sneaker Store</p>
                            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight mb-6">
                                About Us
                            </h2>
                            <p className="text-sm font-medium leading-relaxed text-white/70 max-w-lg">
                                Walker Sneaker Store is a modern footwear retailer offering a wide range of popular sneaker brands and
                                stylish urban footwear. The store focuses on delivering high-quality, trendy products that appeal to sneaker
                                enthusiasts and everyday customers alike. With a customer-friendly shopping experience and reliable service,
                                Walker has become a trusted destination for fashionable, authentic sneakers.
                            </p>
                        </div>

                        {/* Right illustration / image */}
                        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:flex items-center justify-center">
                            {/* Decorative circles */}
                            <div className="absolute right-12 w-64 h-64 rounded-full bg-white/5 border border-white/10" />
                            <div className="absolute right-24 bottom-4 w-40 h-40 rounded-full bg-white/5 border border-white/10" />
                            {/* Illustration SVG - simplified person with phone/app */}
                            <svg viewBox="0 0 300 280" className="w-72 h-72 relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Person body */}
                                <circle cx="160" cy="60" r="30" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                                <path d="M130 100 Q160 90 190 100 L200 180 H120 Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                                {/* Arm holding phone */}
                                <path d="M190 120 Q220 110 230 130" stroke="rgba(255,255,255,0.25)" strokeWidth="8" strokeLinecap="round"/>
                                {/* Phone/tablet */}
                                <rect x="215" y="100" width="50" height="80" rx="6" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
                                <rect x="220" y="110" width="40" height="50" rx="3" fill="rgba(255,255,255,0.12)"/>
                                {/* Screen content lines */}
                                <rect x="224" y="115" width="25" height="3" rx="1" fill="rgba(255,255,255,0.4)"/>
                                <rect x="224" y="122" width="32" height="2" rx="1" fill="rgba(255,255,255,0.25)"/>
                                <rect x="224" y="128" width="20" height="2" rx="1" fill="rgba(255,255,255,0.25)"/>
                                <rect x="224" y="138" width="32" height="12" rx="2" fill="rgba(255,255,255,0.2)"/>
                                {/* Legs */}
                                <path d="M130 180 L120 240" stroke="rgba(255,255,255,0.2)" strokeWidth="14" strokeLinecap="round"/>
                                <path d="M170 180 L180 240" stroke="rgba(255,255,255,0.2)" strokeWidth="14" strokeLinecap="round"/>
                                {/* Sneaker on foot */}
                                <ellipse cx="116" cy="244" rx="22" ry="9" fill="rgba(255,255,255,0.3)"/>
                                <ellipse cx="184" cy="244" rx="22" ry="9" fill="rgba(255,255,255,0.3)"/>
                                {/* Floating elements */}
                                <circle cx="80" cy="140" r="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                                <circle cx="90" cy="200" r="5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                                <circle cx="260" cy="200" r="6" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                                {/* Star/sparkle */}
                                <path d="M75 100 L77 94 L79 100 L85 102 L79 104 L77 110 L75 104 L69 102 Z" fill="rgba(255,255,255,0.4)"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── MISSION SPLIT ── */}
            <section className="py-20 px-4">
                <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-2 lg:gap-20 items-center">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-charcoal/40 mb-3">Our Mission</p>
                        <h3 className="text-3xl font-black uppercase tracking-tight leading-tight mb-6">
                            Authentic Pairs, Every Time.
                        </h3>
                        <p className="text-sm font-medium leading-loose text-gray-500 mb-4">
                            With a customer-friendly shopping experience and reliable service, Walker has become a trusted
                            destination for fashionable, authentic sneakers. Every pair in our vault is verified before
                            it ships to you — no compromises.
                        </p>
                        <p className="text-sm font-medium leading-loose text-gray-500 mb-8">
                            We stock the latest drops from Nike, Adidas, Jordan, New Balance, and more — curated
                            for lifestyle, performance, and everything in between.
                        </p>
                        <Link
                            href={route("shop.index")}
                            className="inline-block bg-brand-charcoal text-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-brand-slate transition-colors"
                        >
                            Shop Now →
                        </Link>
                    </div>
                    <div className="mt-12 lg:mt-0 aspect-[4/3] bg-brand-surface overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=1450&auto=format&fit=crop"
                            alt="Sneakers"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                </div>
            </section>

            {/* ── VALUES ── */}
            <section className="py-20 px-4 bg-brand-surface/30 border-t border-b border-brand-surface">
                <div className="mx-auto max-w-7xl">
                    <div className="text-center mb-12">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-charcoal/40 mb-2">What We Stand For</p>
                        <h3 className="text-3xl font-black uppercase tracking-tight">Our Values</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: "100% Authentic",
                                body: "Every single pair is verified by our expert team before it reaches your door. No fakes, no exceptions.",
                                icon: (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                ),
                            },
                            {
                                title: "Curated Selection",
                                body: "We don't stock everything — we stock the right things. The most coveted drops, carefully selected for our community.",
                                icon: (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                ),
                            },
                            {
                                title: "Community First",
                                body: "Walker is built for sneaker culture. We listen to our community, stock what they want, and deliver an experience they deserve.",
                                icon: (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                                    </svg>
                                ),
                            },
                        ].map(v => (
                            <div key={v.title} className="bg-white p-8 border border-brand-surface flex flex-col gap-4 hover:shadow-sm transition-shadow">
                                <div className="text-brand-charcoal">{v.icon}</div>
                                <h4 className="text-base font-black uppercase tracking-tight">{v.title}</h4>
                                <p className="text-sm font-medium leading-loose text-gray-500">{v.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section className="py-16 px-4 bg-brand-charcoal text-white">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 overflow-hidden">
                        {[
                            { value: "500+", label: "Drops Curated" },
                            { value: "4", label: "Premium Brands" },
                            { value: "100%", label: "Authenticated" },
                            { value: "30", label: "Day Returns" },
                        ].map(s => (
                            <div key={s.label} className="bg-brand-charcoal px-8 py-12 text-center">
                                <p className="text-4xl font-black tracking-tightest mb-2">{s.value}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-20 px-4 text-center border-t border-brand-surface">
                <div className="mx-auto max-w-xl">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-charcoal/30 mb-3">Ready to Shop?</p>
                    <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Find Your Next Drop.</h3>
                    <p className="text-sm font-medium text-gray-400 leading-loose mb-8">
                        Browse our full archive of verified authentic sneakers from the world's most coveted brands.
                    </p>
                    <Link
                        href={route("shop.index")}
                        className="inline-block bg-brand-charcoal text-white px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-brand-slate transition-colors"
                    >
                        Browse All Products →
                    </Link>
                </div>
            </section>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <Footer />
        </div>
    );
}
