import React, { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import CartDrawer from "@/Components/CartDrawer";
import Footer from "@/Components/Footer";
import NotificationBell from "@/Components/NotificationBell";

export default function PrivacyPolicy() {
    const { auth, cart }: any = usePage().props;
    const [isCartOpen,     setIsCartOpen]     = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const cartCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;

    const sections = [
        {
            title: "Information We Collect",
            body: [
                "When you create an account or place an order on SNEAKER.DRP, we collect information you provide directly — including your name, email address, phone number, shipping address, and payment information.",
                "We also automatically collect certain technical information when you visit our site, such as your IP address, browser type, device information, pages visited, and referring URLs. This helps us improve performance and diagnose issues.",
            ],
        },
        {
            title: "How We Use Your Information",
            body: [
                "We use your information to process and fulfil your orders, send order confirmations and shipping updates, respond to customer support enquiries, and improve our products and services.",
                "With your consent, we may send you promotional emails about new drops, exclusive releases, and offers. You can opt out of marketing communications at any time via the unsubscribe link in any email.",
            ],
        },
        {
            title: "Sharing Your Information",
            body: [
                "We do not sell, rent, or trade your personal information to third parties for their marketing purposes.",
                "We share your information only with trusted service providers who help us operate our business — such as payment processors, shipping carriers, and email delivery platforms — and only to the extent necessary to provide those services. All service providers are contractually required to keep your data secure and confidential.",
            ],
        },
        {
            title: "Payment Security",
            body: [
                "All payment transactions are processed through secure, PCI-DSS compliant payment processors. We do not store your full card details on our servers.",
                "Our site uses HTTPS encryption across all pages to protect data in transit between your browser and our servers.",
            ],
        },
        {
            title: "Cookies",
            body: [
                "We use cookies and similar tracking technologies to maintain your session, remember your cart, and understand how visitors use our site. Essential cookies are required for the site to function correctly.",
                "You can control non-essential cookies through your browser settings. Note that disabling cookies may affect your ability to use certain features such as the cart and checkout.",
            ],
        },
        {
            title: "Data Retention",
            body: [
                "We retain your account information and order history for as long as your account is active or as needed to provide our services. If you request account deletion, we will remove your personal data within 30 days, except where we are required to retain it for legal or tax compliance purposes.",
            ],
        },
        {
            title: "Your Rights",
            body: [
                "You have the right to access, correct, or delete the personal information we hold about you. You may also request a copy of your data or ask us to restrict how we process it.",
                "To exercise any of these rights, contact us at the email address below. We will respond to all requests within 30 days.",
            ],
        },
        {
            title: "Children's Privacy",
            body: [
                "SNEAKER.DRP is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately and we will delete it.",
            ],
        },
        {
            title: "Changes to This Policy",
            body: [
                "We may update this Privacy Policy from time to time. When we do, we will revise the effective date at the top of this page. We encourage you to review this policy periodically to stay informed about how we protect your information.",
                "Continued use of SNEAKER.DRP after any changes constitutes your acceptance of the updated policy.",
            ],
        },
        {
            title: "Contact Us",
            body: [
                "If you have any questions, concerns, or requests regarding this Privacy Policy or the way we handle your personal data, please contact us at:",
                "📧 support@sneaker.drp",
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title="Privacy Policy — SNEAKER.DRP" />

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
                            <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)}
                                className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors text-brand-charcoal">
                                {item.label}
                            </Link>
                        ))}
                        {auth?.user ? (
                            <>
                                <Link href="/profile" onClick={() => setMobileMenuOpen(false)}
                                    className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors">
                                    {auth.user.name}
                                </Link>
                                <Link href="/orders" onClick={() => setMobileMenuOpen(false)}
                                    className="text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors">
                                    My Orders
                                </Link>
                                <Link href="/logout" method="post" as="button" onClick={() => setMobileMenuOpen(false)}
                                    className="text-left text-xs font-black uppercase tracking-widest py-3 border-b border-brand-surface hover:text-brand-slate transition-colors cursor-pointer">
                                    Log Out
                                </Link>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)}
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
                        <Link href={route("shop.index")} className="hover:text-brand-slate transition-colors">The Archive</Link>
                        <Link href={route("about")} className="hover:text-brand-slate transition-colors">About Us</Link>
                    </div>
                    <h1 className="text-2xl font-black tracking-tightest uppercase flex-shrink-0">
                        <Link href={route("home")}>SNEAKER.DRP</Link>
                    </h1>
                    {/* Desktop right */}
                    <div className="flex-1 hidden lg:flex justify-end items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                        {auth?.user ? (
                            <>
                                <Link href="/profile" className="hover:text-brand-slate transition-colors">{auth.user.name}</Link>
                                <Link href="/orders" className="hover:text-brand-slate transition-colors">My Orders</Link>
                                <Link href="/logout" method="post" as="button" className="hover:text-brand-slate transition-colors uppercase cursor-pointer">Log Out</Link>
                                <NotificationBell userId={auth.user.id} />
                            </>
                        ) : (
                            <Link href="/login" className="hover:text-brand-slate transition-colors">Login</Link>
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
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/40 mb-6">Legal</p>
                    <h2 className="text-4xl sm:text-6xl lg:text-8xl font-black uppercase tracking-tightest leading-[0.85] max-w-3xl">
                        Privacy Policy.
                    </h2>
                    <p className="mt-10 text-base font-medium leading-loose text-white/60 max-w-xl">
                        Your privacy matters to us. This policy explains what information we collect,
                        how we use it, and your rights as a customer of SNEAKER.DRP.
                    </p>
                    <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-white/30">
                        Last updated: March 2026
                    </p>
                </div>
            </section>

            {/* ── CONTENT ── */}
            <section className="py-24 px-4">
                <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[280px_1fr] lg:gap-24">

                    {/* Sticky sidebar index — desktop only */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-28">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-charcoal/30 mb-6">Contents</p>
                            <nav className="flex flex-col gap-1">
                                {sections.map((s, i) => (
                                    <a key={s.title} href={`#section-${i}`}
                                        className="text-[10px] font-black uppercase tracking-widest text-brand-slate/40 hover:text-brand-charcoal transition-colors py-1.5 border-l-2 border-transparent hover:border-brand-charcoal pl-3">
                                        {s.title}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Policy sections */}
                    <div className="mt-12 lg:mt-0 flex flex-col divide-y divide-brand-surface">
                        {sections.map((s, i) => (
                            <div key={s.title} id={`section-${i}`} className="py-12 first:pt-0">
                                <h3 className="text-xl font-black uppercase tracking-tight mb-6">{s.title}</h3>
                                <div className="flex flex-col gap-4">
                                    {s.body.map((para, j) => (
                                        <p key={j} className="text-sm font-medium leading-loose text-brand-slate/60">
                                            {para}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-24 px-4 bg-brand-charcoal text-white text-center">
                <div className="mx-auto max-w-xl">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">
                        Questions?
                    </p>
                    <h3 className="text-4xl font-black uppercase tracking-tightest mb-6">
                        We're Here to Help.
                    </h3>
                    <p className="text-sm font-medium text-white/50 leading-loose mb-10">
                        If you have any concerns about your privacy or how we handle your data,
                        don't hesitate to reach out to our team.
                    </p>
                    <Link
                        href={route("home")}
                        className="inline-block bg-brand-white text-brand-charcoal px-12 py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-surface transition-colors"
                    >
                        Back to SNEAKER.DRP →
                    </Link>
                </div>
            </section>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <Footer />
        </div>
    );
}
