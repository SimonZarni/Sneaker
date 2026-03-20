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

/** Resolve effective price: variant_price → sale_price → base_price */
function effectivePrice(item: any): number {
    if (item.product_variant.variant_price != null) {
        return parseFloat(item.product_variant.variant_price);
    }
    const product = item.product_variant.product;
    if (product.is_on_sale) {
        return parseFloat(product.effective_price);
    }
    return parseFloat(product.base_price);
}

export default function Checkout({ cart, savedAddresses, shippingFee }: { cart: any; savedAddresses: Address[]; shippingFee: number }) {
    const { data, setData, post, processing, errors } = useForm({
        shipping_full_name:    '',
        shipping_phone:        '',
        shipping_address_line: '',
        shipping_city:         '',
        shipping_state_region: '',
        shipping_postal_code:  '',
        shipping_country:      '',
        payment_method:        'Credit Card',
        cardholder_name:       '',
        card_number:           '',
        card_expiry:           '',
        card_cvc:              '',
    });

    const [cardNumberDisplay, setCardNumberDisplay] = useState('');
    const [expiryDisplay, setExpiryDisplay]         = useState('');

    const isCard = data.payment_method === 'Credit Card';
    const isCOD  = data.payment_method === 'COD';

    const selectSavedAddress = (address: Address) => {
        setData({
            ...data,
            shipping_full_name:    address.full_name,
            shipping_phone:        address.phone,
            shipping_address_line: address.address_line,
            shipping_city:         address.city,
            shipping_state_region: address.state_region  || '',
            shipping_postal_code:  address.postal_code   || '',
            shipping_country:      address.country,
        });
    };

    const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw     = e.target.value.replace(/\D/g, '').slice(0, 16);
        const display = raw.replace(/(.{4})/g, '$1 ').trim();
        setCardNumberDisplay(display);
        setData('card_number', raw.slice(-4));
    };

    const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw     = e.target.value.replace(/\D/g, '').slice(0, 4);
        const display = raw.length >= 3 ? raw.slice(0, 2) + '/' + raw.slice(2) : raw;
        setExpiryDisplay(display);
        setData('card_expiry', display);
    };

    // Use variant_price when set, fall back to product base_price
    const subtotal = cart.items.reduce(
        (acc: number, item: any) => acc + effectivePrice(item) * item.quantity,
        0,
    );
    const total = subtotal + shippingFee;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('checkout.store'));
    };

    const inputCls =
        'w-full border-0 border-b border-brand-surface focus:border-brand-charcoal focus:ring-0 px-0 py-4 text-sm bg-transparent placeholder:text-brand-slate/20 transition-colors';
    const labelCls =
        'text-[9px] font-black uppercase mb-2 block tracking-widest text-brand-slate group-focus-within:text-brand-charcoal transition-colors';
    const errorCls = 'text-[9px] text-red-500 font-bold uppercase mt-1.5 block';

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head title="Secure Transaction — WALKER SNEAKER" />

            <nav className="border-b border-brand-surface py-10">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <Link href="/shop" className="text-[10px] font-black uppercase tracking-[0.3em] hover:text-brand-slate transition-colors">
                        ← Exit Checkout
                    </Link>
                    <h1 className="text-2xl font-black tracking-tightest">WALKER SNEAKER</h1>
                    <div className="w-24 hidden md:block" />
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-16 lg:flex lg:gap-24">

                {/* LEFT COLUMN */}
                <div className="lg:w-[60%] space-y-20">

                    {savedAddresses.length > 0 && (
                        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-brand-slate/40">
                                Select Saved Destination
                            </h2>
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
                                            {addr.address_line}, {addr.city}<br />{addr.country}
                                        </p>
                                        <div className="absolute bottom-4 right-4 text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                            Select →
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-16">

                        {/* Shipping */}
                        <section>
                            <div className="flex justify-between items-end mb-10">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-slate/40">Shipping Information</h2>
                                <span className="text-[8px] font-black text-brand-slate/30 uppercase italic">* Required for courier</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                                <div className="md:col-span-2 group">
                                    <label className={labelCls}>Recipient Full Name</label>
                                    <input type="text" value={data.shipping_full_name} onChange={(e) => setData('shipping_full_name', e.target.value)} className={inputCls} placeholder="REQUIRED" />
                                    {errors.shipping_full_name && <span className={errorCls}>{errors.shipping_full_name}</span>}
                                </div>
                                <div className="group">
                                    <label className={labelCls}>Phone Number</label>
                                    <input type="text" value={data.shipping_phone} onChange={(e) => setData('shipping_phone', e.target.value)} className={inputCls} />
                                    {errors.shipping_phone && <span className={errorCls}>{errors.shipping_phone}</span>}
                                </div>
                                <div className="group">
                                    <label className={labelCls}>Country</label>
                                    <input type="text" value={data.shipping_country} onChange={(e) => setData('shipping_country', e.target.value)} className={inputCls} />
                                    {errors.shipping_country && <span className={errorCls}>{errors.shipping_country}</span>}
                                </div>
                                <div className="md:col-span-2 group">
                                    <label className={labelCls}>Street Address</label>
                                    <input type="text" value={data.shipping_address_line} onChange={(e) => setData('shipping_address_line', e.target.value)} className={inputCls} />
                                    {errors.shipping_address_line && <span className={errorCls}>{errors.shipping_address_line}</span>}
                                </div>
                                <div className="group">
                                    <label className={labelCls}>City</label>
                                    <input type="text" value={data.shipping_city} onChange={(e) => setData('shipping_city', e.target.value)} className={inputCls} />
                                    {errors.shipping_city && <span className={errorCls}>{errors.shipping_city}</span>}
                                </div>
                                <div className="group">
                                    <label className={labelCls}>State / Region</label>
                                    <input type="text" value={data.shipping_state_region} onChange={(e) => setData('shipping_state_region', e.target.value)} className={inputCls} />
                                    {errors.shipping_state_region && <span className={errorCls}>{errors.shipping_state_region}</span>}
                                </div>
                                <div className="group">
                                    <label className={labelCls}>Postal Code</label>
                                    <input type="text" value={data.shipping_postal_code} onChange={(e) => setData('shipping_postal_code', e.target.value)} className={inputCls} />
                                </div>
                            </div>
                        </section>

                        {/* Payment */}
                        <section>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-brand-slate/40">Payment Method</h2>
                            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                <button type="button" onClick={() => setData('payment_method', 'Credit Card')}
                                    className={`flex-1 py-8 border text-[10px] font-black uppercase tracking-[0.2em] transition-all flex flex-col items-center gap-3 ${isCard ? 'border-brand-charcoal bg-brand-charcoal text-brand-white shadow-xl' : 'border-brand-surface text-brand-slate hover:border-brand-charcoal'}`}>
                                    <svg className={`w-6 h-6 ${isCard ? 'text-brand-white' : 'text-brand-slate/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" /><path d="M2 10h20" stroke="currentColor" />
                                    </svg>
                                    <span>Debit / Credit Card</span>
                                </button>
                                <button type="button" onClick={() => setData('payment_method', 'COD')}
                                    className={`flex-1 py-8 border text-[10px] font-black uppercase tracking-[0.2em] transition-all flex flex-col items-center gap-3 ${isCOD ? 'border-brand-charcoal bg-brand-charcoal text-brand-white shadow-xl' : 'border-brand-surface text-brand-slate hover:border-brand-charcoal'}`}>
                                    <svg className={`w-6 h-6 ${isCOD ? 'text-brand-white' : 'text-brand-slate/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                                    </svg>
                                    <span>Cash on Delivery</span>
                                </button>
                            </div>

                            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isCard ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="border border-brand-surface p-8 space-y-10 bg-brand-surface/20">
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-brand-slate/40">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                        </svg>
                                        <span>Secured Entry — Card Data Not Stored</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-y-10">
                                        <div className="group">
                                            <label className={labelCls}>Cardholder Name</label>
                                            <input type="text" value={data.cardholder_name} onChange={(e) => setData('cardholder_name', e.target.value.toUpperCase())} className={inputCls} placeholder="AS PRINTED ON CARD" autoComplete="cc-name" />
                                            {errors.cardholder_name && <span className={errorCls}>{errors.cardholder_name}</span>}
                                        </div>
                                        <div className="group">
                                            <label className={labelCls}>Card Number</label>
                                            <input type="text" inputMode="numeric" value={cardNumberDisplay} onChange={handleCardNumber} className={`${inputCls} font-mono tracking-[0.15em]`} placeholder="0000 0000 0000 0000" autoComplete="cc-number" />
                                            {errors.card_number && <span className={errorCls}>{errors.card_number}</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="group">
                                                <label className={labelCls}>Expiry Date</label>
                                                <input type="text" inputMode="numeric" value={expiryDisplay} onChange={handleExpiry} className={`${inputCls} font-mono tracking-[0.15em]`} placeholder="MM/YY" autoComplete="cc-exp" />
                                                {errors.card_expiry && <span className={errorCls}>{errors.card_expiry}</span>}
                                            </div>
                                            <div className="group">
                                                <label className={labelCls}>CVC / CVV</label>
                                                <input type="password" inputMode="numeric" value={data.card_cvc} onChange={(e) => setData('card_cvc', e.target.value.replace(/\D/g, '').slice(0, 4))} className={`${inputCls} font-mono tracking-[0.15em]`} placeholder="•••" autoComplete="cc-csc" />
                                                {errors.card_cvc && <span className={errorCls}>{errors.card_cvc}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isCOD ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="border border-brand-surface p-8 bg-brand-surface/20 flex items-start gap-4">
                                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-slate/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                    </svg>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest">Payment on Delivery</p>
                                        <p className="text-[10px] text-brand-slate/50 leading-relaxed font-medium">Have the exact amount ready when your order arrives. Our courier will collect payment at the door.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Stock / availability errors from backend */}
                        {(errors as any).stock && (
                            <div className="border border-red-200 bg-red-50 px-6 py-4 space-y-1">
                                {Array.isArray((errors as any).stock)
                                    ? (errors as any).stock.map((msg: string, i: number) => (
                                        <p key={i} className="text-[9px] font-black uppercase tracking-wide text-red-600">{msg}</p>
                                    ))
                                    : <p className="text-[9px] font-black uppercase tracking-wide text-red-600">{(errors as any).stock}</p>
                                }
                            </div>
                        )}

                        <button type="submit" disabled={processing}
                            className="w-full bg-brand-charcoal text-brand-white py-10 text-[11px] font-black uppercase tracking-[0.6em] hover:bg-brand-slate transition-all disabled:opacity-20 shadow-2xl hover:shadow-none">
                            {processing ? 'Securing Transaction...' : 'Complete Purchase'}
                        </button>
                    </form>
                </div>

                {/* RIGHT COLUMN: ORDER MANIFEST */}
                <div className="lg:w-[40%] mt-20 lg:mt-0">
                    <div className="bg-brand-surface/50 p-10 sticky top-32 border border-brand-surface backdrop-blur-sm">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-brand-slate/40 text-center">Order Manifest</h2>

                        <div className="space-y-10 mb-12">
                            {cart.items.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-start gap-6 group">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-20 bg-brand-white flex-shrink-0 border border-brand-surface overflow-hidden">
                                            <img src={item.product_variant.product.main_image_url} alt={item.product_variant.product.name} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase leading-tight tracking-tight">{item.product_variant.product.name}</p>
                                            <p className="text-[9px] font-bold text-brand-slate/50 uppercase mt-2 tracking-widest">
                                                Size {item.product_variant.size.size_value} // Qty {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                    {/* variant_price when set, otherwise base_price */}
                                    <p className="text-[11px] font-black tracking-tighter tabular-nums">
                                        ${(effectivePrice(item) * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6 border-t border-brand-charcoal/5 pt-10">
                            <div className="flex justify-between text-[10px] font-black uppercase text-brand-slate/60 tracking-widest">
                                <span>Subtotal</span>
                                <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase text-brand-slate/60 tracking-widest">
                                <span>Shipping</span>
                                <span className={shippingFee > 0 ? "tabular-nums" : "text-brand-charcoal"}>
                                    {shippingFee > 0 ? `$${shippingFee.toFixed(2)}` : "Complimentary"}
                                </span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase text-brand-slate/60 tracking-widest">
                                <span>Payment</span>
                                <span className="text-brand-charcoal">{data.payment_method === 'COD' ? 'Cash on Delivery' : 'Card'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Total Value</span>
                                <span className="text-4xl font-black tracking-tightest leading-none tabular-nums">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-20 text-center border-t border-brand-surface opacity-20">
                <p className="text-[8px] font-black uppercase tracking-[0.8em]">Encrypted End-to-End Secure Transaction</p>
            </footer>
        </div>
    );
}
