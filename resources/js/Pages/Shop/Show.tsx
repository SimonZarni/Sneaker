import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import CartDrawer from "@/Components/CartDrawer";

interface Product {
    id: number;
    name: string;
    description: string;
    base_price: string;
    main_image_url: string;
    brand: { name: string };
    category: { name: string };
    variants: Array<{
        id: number;
        size: { id: number; size_value: string };
        color: { id: number; name: string; hex_code: string };
        stock_quantity: number;
    }>;
}

interface Props {
    product: Product;
}

export default function Show({ product }: Props) {
    const { cart }: any = usePage().props; // Get global cart data for the counter
    const [selectedSize, setSelectedSize] = useState<number | null>(null);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // 1. Get unique sizes
    const uniqueSizes = product.variants
        .map((v) => v.size)
        .filter(
            (item, index, self) =>
                item && self.findIndex((t) => t.id === item.id) === index,
        )
        .sort((a, b) => parseFloat(a.size_value) - parseFloat(b.size_value));

    // 2. Get unique colors
    const uniqueColors = product.variants
        .map((v) => v.color)
        .filter(
            (item, index, self) =>
                item && self.findIndex((t) => t.id === item.id) === index,
        );

    // 3. Find specific variant
    const selectedVariant = product.variants.find(
        (v) => v.size?.id === selectedSize && v.color?.id === selectedColor,
    );

    const hasSelectedBoth = selectedSize && selectedColor;
    const isOutOfStock =
        hasSelectedBoth && selectedVariant?.stock_quantity === 0;
    const currentColorName = uniqueColors.find(
        (c) => c.id === selectedColor,
    )?.name;

    // 4. Handle Add to Vault logic
    // const handleAddToVault = () => {
    //     if (!selectedVariant) return;

    //     router.post('/cart', {
    //         product_variant_id: selectedVariant.id,
    //         quantity: 1
    //     }, {
    //         onSuccess: () => setIsCartOpen(true), // Slide the drawer open on success
    //         preserveScroll: true,
    //     });
    // };
    const handleAddToVault = () => {
        if (!selectedVariant) return;

        router.post(
            "/cart",
            {
                product_variant_id: selectedVariant.id,
                quantity: 1,
            },
            {
                // This is the magic part:
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setIsCartOpen(true),
            },
        );
    };

    // Calculate item count for navbar
    const cartCount =
        cart?.items?.reduce(
            (acc: number, item: any) => acc + item.quantity,
            0,
        ) || 0;

    return (
        <div className="min-h-screen bg-brand-white text-brand-charcoal antialiased">
            <Head
                title={`${product.brand.name} ${product.name} — SNEAKER.DRP`}
            />

            {/* Editorial Navigation */}
            <nav className="border-b border-brand-surface py-6 sticky top-0 bg-brand-white/80 backdrop-blur-md z-50">
                <div className="mx-auto max-w-7xl px-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <Link
                        href="/shop"
                        className="hover:text-brand-slate transition-colors"
                    >
                        ← Back to Collection
                    </Link>
                    <h1 className="text-xl tracking-tightest">SNEAKER.DRP</h1>
                    <div className="flex gap-6">
                        <Link href="/login" className="hover:text-brand-slate">
                            Account
                        </Link>
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="hover:text-brand-slate uppercase flex items-center gap-2"
                        >
                            Vault ({cartCount})
                        </button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-4 py-12 lg:flex lg:gap-x-16">
                {/* LEFT COLUMN: Gallery */}
                <div className="lg:w-[65%] space-y-6">
                    <div className="aspect-[4/5] bg-brand-surface overflow-hidden border border-brand-surface">
                        <img
                            src={
                                product.main_image_url ||
                                "https://via.placeholder.com/1000"
                            }
                            className="w-full h-full object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-700"
                            alt={product.name}
                        />
                    </div>
                    <div className="aspect-[4/5] bg-brand-surface flex items-center justify-center border border-brand-surface">
                        <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-brand-slate/30">
                            Detail View 01
                        </span>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar */}
                <div className="lg:w-[35%] mt-12 lg:mt-0 lg:sticky lg:top-32 lg:h-fit">
                    <div className="border-b border-brand-surface pb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-slate/40">
                                {product.brand.name}
                            </span>
                            <span className="w-1 h-1 bg-brand-surface rounded-full"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-slate/40">
                                {product.category.name}
                            </span>
                        </div>
                        <h2 className="text-5xl font-black uppercase tracking-tightest leading-[0.85] mb-6">
                            {product.name}
                        </h2>
                        <p className="text-2xl font-medium tracking-tighter">
                            ${product.base_price}
                        </p>
                    </div>

                    {/* Color Selection */}
                    <div className="py-10 border-b border-brand-surface">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-slate/60">
                                Colorway
                            </span>
                            <span className="text-[10px] font-bold uppercase text-brand-charcoal">
                                {currentColorName || "Choose"}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {uniqueColors.map((color) => (
                                <button
                                    key={color.id}
                                    onClick={() => setSelectedColor(color.id)}
                                    className={`w-12 h-12 rounded-full border transition-all duration-300 ${
                                        selectedColor === color.id
                                            ? "border-brand-charcoal scale-110 ring-4 ring-brand-surface"
                                            : "border-brand-surface hover:border-brand-charcoal"
                                    }`}
                                    style={{ backgroundColor: color.hex_code }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div className="py-10 border-b border-brand-surface">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-slate/60">
                                Select Size (US)
                            </span>
                            <button className="text-[10px] font-bold uppercase border-b border-brand-charcoal hover:text-brand-slate transition-colors">
                                Size Guide
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-px bg-brand-surface border border-brand-surface overflow-hidden">
                            {uniqueSizes.map((size) => (
                                <button
                                    key={size.id}
                                    onClick={() => setSelectedSize(size.id)}
                                    className={`py-5 text-xs font-bold uppercase transition-all duration-200 ${
                                        selectedSize === size.id
                                            ? "bg-brand-charcoal text-brand-white"
                                            : "bg-brand-white text-brand-charcoal hover:bg-brand-surface"
                                    }`}
                                >
                                    {size.size_value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Add to Vault Action */}
                    <div className="pt-10">
                        {hasSelectedBoth && (
                            <div className="mb-4 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-slate/60">
                                    Availability
                                </span>
                                <span
                                    className={`text-[10px] font-bold uppercase px-2 py-1 ${
                                        selectedVariant?.stock_quantity &&
                                        selectedVariant.stock_quantity < 5
                                            ? "bg-red-50 text-red-600"
                                            : "bg-brand-surface text-brand-charcoal"
                                    }`}
                                >
                                    {isOutOfStock
                                        ? "Sold Out"
                                        : `${selectedVariant?.stock_quantity ?? 0} Units in Vault`}
                                </span>
                            </div>
                        )}

                        <button
                            onClick={handleAddToVault}
                            disabled={
                                !selectedSize ||
                                !selectedColor ||
                                isOutOfStock ||
                                false
                            }
                            className="w-full bg-brand-charcoal text-brand-white py-7 text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:bg-brand-slate disabled:bg-brand-surface disabled:text-brand-slate/30 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                            <span className="relative z-10">
                                {isOutOfStock
                                    ? "Out of Stock"
                                    : !selectedSize || !selectedColor
                                      ? "Select Variant"
                                      : "Add to Vault"}
                            </span>
                        </button>
                    </div>

                    {/* Story */}
                    <div className="mt-16 space-y-8">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-4">
                                The Story
                            </h4>
                            <p className="text-xs leading-loose text-brand-slate font-medium">
                                {product.description}
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Cart Slide-over Component */}
            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
            />
        </div>
    );
}
