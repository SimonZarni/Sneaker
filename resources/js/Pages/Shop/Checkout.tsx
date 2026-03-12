import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

interface Address {
    id: number;
    full_name: string;
    phone: string;
    address_line: string;
    city: string;
    state_region: string;
    postal_code: string;
    country: string;
    is_default: boolean;
}

export default function Checkout({ cart, savedAddresses }: { cart: any, savedAddresses: Address[] }) {
    const { data, setData, post, processing, errors } = useForm({
        shipping_full_name: '',
        shipping_phone: '',
        shipping_address_line: '',
        shipping_city: '',
        shipping_state_region: '',
        shipping_postal_code: '',
        shipping_country: '',
        payment_method: 'Credit Card',
    });

    // Handle Quick Select Address
    const selectSavedAddress = (address: Address) => {
        setData({
            ...data,
            shipping_full_name: address.full_name,
            shipping_phone: address.phone,
            shipping_address_line: address.address_line,
            shipping_city: address.city,
            shipping_state_region: address.state_region || '',
            shipping_postal_code: address.postal_code || '',
            shipping_country: address.country,
        });
    };

    const subtotal = cart.items.reduce((acc: number, item: any) =>
        acc + (parseFloat(item.product_variant.product.base_price) * item.quantity), 0
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('checkout.store'));
    };

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title="Secure Transaction — SNEAKER.DRP" />

            {/* Simple Header */}
            <nav className="border-b border-brand-surface py-10">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <Link href="/shop" className="text-[10px] font-black uppercase tracking-[0.3em] hover:text-brand-slate transition-colors">
                        ← Exit Checkout
                    </Link>
                    <h1 className="text-2xl font-black tracking-tightest">SNEAKER.DRP</h1>
                    <div className="w-24 hidden md:block"></div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-16 lg:flex lg:gap-24">

                {/* LEFT COLUMN: Addressing & Payment */}
                <div className="lg:w-[60%] space-y-20">

                    {/* 01. QUICK SELECT (Address Book) */}
                    {savedAddresses.length > 0 && (
                        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-brand-slate/40">Select Saved Destination</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {savedAddresses.map((addr) => (
                                    <button
                                        key={addr.id}
                                        type="button"
                                        onClick={() => selectSavedAddress(addr)}
                                        className="text-left p-6 border border-brand-surface hover:border-brand-charcoal transition-all group relative overflow-hidden bg-brand-surface/20"
                                    >
                                        <p className="text-[10px] font-black uppercase mb-2">{addr.full_name}</p>
                                        <p className="text-[10px] text-brand-slate/70 leading-relaxed uppercase">
                                            {addr.address_line}, {addr.city}<br />
                                            {addr.country}
                                        </p>
                                        <div className="absolute bottom-4 right-4 text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                            Select →
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 02. SHIPPING FORM */}
                    <form onSubmit={handleSubmit} className="space-y-16">
                        <section>
                            <div className="flex justify-between items-end mb-10">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-slate/40">Shipping Information</h2>
                                <span className="text-[8px] font-black text-brand-slate/30 uppercase italic">* All fields required for courier</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                                <div className="md:col-span-2 group">
                                    <label className="text-[9px] font-black uppercase mb-2 block tracking-widest text-brand-slate group-focus-within:text-brand-charcoal transition-colors">Recipient Full Name</label>
                                    <input
                                        type="text"
                                        value={data.shipping_full_name}
                                        onChange={e => setData('shipping_full_name', e.target.value)}
                                        className="w-full border-0 border-b border-brand-surface focus:border-brand-charcoal focus:ring-0 px-0 py-4 text-sm bg-transparent placeholder:text-brand-surface"
                                        placeholder="REQUIRED"
                                    />
                                    {errors.shipping_full_name && <span className="text-[9px] text-red-500 font-bold uppercase mt-2">{errors.shipping_full_name}</span>}
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase mb-2 block tracking-widest text-brand-slate">Phone Number</label>
                                    <input type="text" value={data.shipping_phone} onChange={e => setData('shipping_phone', e.target.value)} className="w-full border-0 border-b border-brand-surface focus:border-brand-charcoal focus:ring-0 px-0 py-4 text-sm bg-transparent" />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase mb-2 block tracking-widest text-brand-slate">Country</label>
                                    <input type="text" value={data.shipping_country} onChange={e => setData('shipping_country', e.target.value)} className="w-full border-0 border-b border-brand-surface focus:border-brand-charcoal focus:ring-0 px-0 py-4 text-sm bg-transparent" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-[9px] font-black uppercase mb-2 block tracking-widest text-brand-slate">Street Address</label>
                                    <input type="text" value={data.shipping_address_line} onChange={e => setData('shipping_address_line', e.target.value)} className="w-full border-0 border-b border-brand-surface focus:border-brand-charcoal focus:ring-0 px-0 py-4 text-sm bg-transparent" />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase mb-2 block tracking-widest text-brand-slate">City</label>
                                    <input type="text" value={data.shipping_city} onChange={e => setData('shipping_city', e.target.value)} className="w-full border-0 border-b border-brand-surface focus:border-brand-charcoal focus:ring-0 px-0 py-4 text-sm bg-transparent" />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase mb-2 block tracking-widest text-brand-slate">Postal Code</label>
                                    <input type="text" value={data.shipping_postal_code} onChange={e => setData('shipping_postal_code', e.target.value)} className="w-full border-0 border-b border-brand-surface focus:border-brand-charcoal focus:ring-0 px-0 py-4 text-sm bg-transparent" />
                                </div>
                            </div>
                        </section>

                        {/* 03. PAYMENT SELECTION */}
                        <section>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-brand-slate/40">Payment Gateway</h2>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    type="button"
                                    onClick={() => setData('payment_method', 'Credit Card')}
                                    className={`flex-1 py-8 border text-[10px] font-black uppercase tracking-[0.2em] transition-all ${data.payment_method === 'Credit Card' ? 'border-brand-charcoal bg-brand-charcoal text-brand-white shadow-xl' : 'border-brand-surface text-brand-slate hover:border-brand-charcoal'}`}
                                >
                                    Debit / Credit Card
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('payment_method', 'Bank Transfer')}
                                    className={`flex-1 py-8 border text-[10px] font-black uppercase tracking-[0.2em] transition-all ${data.payment_method === 'Bank Transfer' ? 'border-brand-charcoal bg-brand-charcoal text-brand-white shadow-xl' : 'border-brand-surface text-brand-slate hover:border-brand-charcoal'}`}
                                >
                                    Direct Transfer
                                </button>
                            </div>
                        </section>

                        <button
                            disabled={processing}
                            className="w-full bg-brand-charcoal text-brand-white py-10 text-[11px] font-black uppercase tracking-[0.6em] hover:bg-brand-slate transition-all disabled:opacity-20 shadow-2xl hover:shadow-none"
                        >
                            {processing ? 'Securing Transaction...' : 'Complete Purchase'}
                        </button>
                    </form>
                </div>

                {/* RIGHT COLUMN: STICKY SUMMARY */}
                <div className="lg:w-[40%] mt-20 lg:mt-0">
                    <div className="bg-brand-surface/50 p-10 sticky top-32 border border-brand-surface backdrop-blur-sm">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-brand-slate/40 text-center">Order Manifest</h2>

                        <div className="space-y-10 mb-12">
                            {cart.items.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-start gap-6 group">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-20 bg-brand-white flex-shrink-0 border border-brand-surface overflow-hidden">
                                            <img src={item.product_variant.product.main_image_url} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase leading-tight tracking-tight">{item.product_variant.product.name}</p>
                                            <p className="text-[9px] font-bold text-brand-slate/50 uppercase mt-2 tracking-widest">
                                                Size {item.product_variant.size.size_value} // Qty {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-black tracking-tighter">
                                        ${(parseFloat(item.product_variant.product.base_price) * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6 border-t border-brand-charcoal/5 pt-10">
                            <div className="flex justify-between text-[10px] font-black uppercase text-brand-slate/60 tracking-widest">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase text-brand-slate/60 tracking-widest">
                                <span>Vault Shipping</span>
                                <span className="text-brand-charcoal">Complimentary</span>
                            </div>
                            <div className="flex justify-between items-center pt-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Total Value</span>
                                <span className="text-4xl font-black tracking-tightest leading-none">
                                    ${subtotal.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Subtle Footer */}
            <footer className="py-20 text-center border-t border-brand-surface opacity-20">
                <p className="text-[8px] font-black uppercase tracking-[0.8em]">Encrypted End-to-End Secure Transaction</p>
            </footer>
        </div>
    );
}
