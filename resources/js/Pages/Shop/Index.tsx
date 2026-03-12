import { Head, Link, usePage } from "@inertiajs/react";
import React from "react";

interface Product {
    id: number;
    name: string;
    base_price: string;
    main_image_url: string;
    brand: { name: string };
}

interface Props {
    products: Product[];
}

export default function Index({ products }: Props) {
    // 1. Pull auth from global props
    const { auth }: any = usePage().props;
    return (
        <div className="min-h-screen bg-brand-white font-sans text-brand-charcoal antialiased">
            <Head title="Shop All Sneakers" />
            <nav className="border-b border-brand-surface bg-brand-white py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <Link href="/">
                        <h1 className="text-2xl font-black tracking-tightest uppercase">
                            SNEAKER.DRP
                        </h1>
                    </Link>

                    <div className="flex items-center space-x-8 text-[10px] font-bold uppercase tracking-widest">
                        <Link
                            href="/shop"
                            className="border-b-2 border-brand-charcoal pb-1"
                        >
                            Shop
                        </Link>

                        {auth.user ? (
                            <div className="flex items-center space-x-6">
                                <Link
                                    href="/profile"
                                    className="text-brand-charcoal hover:text-brand-slate transition-colors"
                                >
                                    {auth.user.name}
                                </Link>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="text-brand-slate/60 hover:text-brand-charcoal transition-colors uppercase cursor-pointer"
                                >
                                    Log Out
                                </Link>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="text-brand-slate/60 hover:text-brand-charcoal transition-colors"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <header className="bg-brand-white pt-16 pb-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-end">
                    <h2 className="text-6xl font-extrabold tracking-tightest uppercase text-brand-charcoal">
                        The Collection
                    </h2>
                    <p className="text-sm text-brand-slate font-medium italic">
                        Showing {products.length} Products
                    </p>
                </div>
            </header>

            <div className="py-12 bg-brand-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* The Grid with 1px architectural lines */}
                    <div className="grid grid-cols-1 gap-px bg-brand-surface border border-brand-surface sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-hidden">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="group relative bg-brand-white p-8 transition-all duration-500 hover:bg-brand-surface/40"
                            >
                                {/* Image Wrapper */}
                                <div className="aspect-[1/1] w-full overflow-hidden bg-brand-surface mb-8">
                                    <img
                                        src={
                                            product.main_image_url ||
                                            "https://via.placeholder.com/600"
                                        }
                                        alt={product.name}
                                        className="h-full w-full object-cover object-center transition-transform duration-1000 group-hover:scale-110"
                                    />
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-slate/40">
                                        {product.brand.name}
                                    </p>
                                    <h3 className="text-xl font-bold uppercase tracking-tighter text-brand-charcoal leading-tight">
                                        <Link href={`/shop/${product.id}`}>
                                            <span
                                                aria-hidden="true"
                                                className="absolute inset-0"
                                            />
                                            {product.name}
                                        </Link>
                                    </h3>
                                    <div className="flex justify-between items-center pt-6">
                                        <p className="text-lg font-medium text-brand-charcoal">
                                            ${product.base_price}
                                        </p>
                                        <span className="text-[10px] font-black uppercase border-b-2 border-brand-charcoal py-1">
                                            View Details
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {products.length === 0 && (
                        <div className="text-center py-40 border border-brand-surface bg-brand-surface/10">
                            <p className="text-brand-slate font-medium uppercase tracking-widest text-xs">
                                Vault currently empty
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
