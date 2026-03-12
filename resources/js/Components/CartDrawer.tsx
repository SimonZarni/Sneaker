import React, { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { cart }: any = usePage().props;

    // 1. Local state for "Pending" quantities
    const [localItems, setLocalItems] = useState<any[]>([]);

    // Sync local state when the cart prop updates or drawer opens
    useEffect(() => {
        if (cart?.items) {
            setLocalItems(cart.items);
        }
    }, [cart, isOpen]);

    // Handle immediate database removal
    const handleRemove = (itemId: number) => {
        if (confirm('Remove this item from your vault?')) {
            router.delete(route('cart.destroy', itemId), {
                preserveScroll: true,
                onSuccess: () => {
                    // Update local state immediately so UI stays in sync
                    setLocalItems(prev => prev.filter(item => item.id !== itemId));
                }
            });
        }
    };

    const handleUpdateLocalQty = (itemId: number, delta: number) => {
        const currentItem = localItems.find(item => item.id === itemId);

        // If clicking minus when quantity is 1, trigger removal
        if (currentItem && currentItem.quantity === 1 && delta === -1) {
            handleRemove(itemId);
            return;
        }

        setLocalItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleCheckout = () => {
        // Send the bulk update to the database right before moving to checkout
        router.post(route('cart.bulk-update'), {
            items: localItems.map(item => ({
                id: item.id,
                quantity: item.quantity
            }))
        });
    };

    const subtotal = localItems.reduce((acc: number, item: any) => {
        return acc + (parseFloat(item.product_variant.product.base_price) * item.quantity);
    }, 0);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-brand-charcoal/40 backdrop-blur-sm z-[100] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-brand-white z-[101] shadow-2xl transition-transform duration-500 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-8 border-b border-brand-surface flex justify-between items-center">
                        <h2 className="text-2xl font-black uppercase tracking-tightest">The Vault</h2>
                        <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest hover:opacity-50 transition-opacity">Close</button>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {localItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Vault Empty</p>
                                <button onClick={onClose} className="text-[10px] border-b border-brand-charcoal pb-1 font-bold uppercase">Back to Drops</button>
                            </div>
                        ) : (
                            localItems.map((item: any) => (
                                <div key={item.id} className="flex gap-6 group relative">
                                    {/* Product Image */}
                                    <div className="w-24 h-28 bg-brand-surface border border-brand-surface overflow-hidden">
                                        <img
                                            src={item.product_variant.product.main_image_url}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>

                                    {/* Product Info & Controls */}
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-sm font-black uppercase tracking-tight pr-4">
                                                    {item.product_variant.product.name}
                                                </h3>
                                                {/* RE-ADDED: Remove Button (Hover only) */}
                                                <button
                                                    onClick={() => handleRemove(item.id)}
                                                    className="text-[9px] font-black uppercase text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <p className="text-[9px] font-bold text-brand-slate/60 uppercase mt-2 tracking-widest">
                                                US {item.product_variant.size.size_value} // {item.product_variant.color.name}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            {/* Stepper with Check for Remove-on-1 */}
                                            <div className="flex items-center border border-brand-surface bg-brand-white">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateLocalQty(item.id, -1)}
                                                    className="px-3 py-1 text-xs font-bold hover:bg-brand-surface transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="px-2 py-1 text-[10px] font-black border-x border-brand-surface min-w-[30px] text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateLocalQty(item.id, 1)}
                                                    className="px-3 py-1 text-xs font-bold hover:bg-brand-surface transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <span className="text-sm font-black tracking-tighter">
                                                ${(parseFloat(item.product_variant.product.base_price) * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-brand-surface border-t border-brand-surface">
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-3xl font-black tracking-tightest">${subtotal.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={localItems.length === 0}
                            className="block w-full bg-brand-charcoal text-brand-white py-6 text-center text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-slate transition-all disabled:bg-brand-slate/20 disabled:cursor-not-allowed"
                        >
                            Confirm Selection & Checkout
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
