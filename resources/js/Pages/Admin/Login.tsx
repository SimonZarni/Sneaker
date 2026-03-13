import React from "react";
import { Head, useForm } from "@inertiajs/react";

export default function AdminLogin() {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("admin.login"));
    };

    const inputCls =
        "w-full border-0 border-b border-gray-200 focus:border-brand-charcoal focus:ring-0 px-0 py-4 text-sm bg-transparent placeholder:text-gray-300 transition-colors";
    const labelCls =
        "text-[9px] font-black uppercase tracking-widest text-brand-slate/50 mb-2 block";

    return (
        <div className="min-h-screen bg-brand-charcoal flex items-center justify-center px-4">
            <Head title="Admin Login — SNEAKER.DRP" />

            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-16">
                    <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/20 mb-3">
                        Admin Panel
                    </p>
                    <h1 className="text-3xl font-black tracking-tightest uppercase text-white">
                        SNEAKER.DRP
                    </h1>
                </div>

                {/* Card */}
                <div className="bg-white p-10 space-y-10">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/30 mb-1">
                            Restricted Access
                        </p>
                        <h2 className="text-xl font-black uppercase tracking-tightest">
                            Sign In
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="space-y-8">
                            <div className="group">
                                <label className={labelCls}>Email Address</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    className={inputCls}
                                    placeholder="admin@sneaker.drp"
                                    autoComplete="email"
                                    autoFocus
                                />
                                {errors.email && (
                                    <span className="text-[9px] text-red-500 font-bold uppercase mt-1.5 block">
                                        {errors.email}
                                    </span>
                                )}
                            </div>

                            <div className="group">
                                <label className={labelCls}>Password</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    className={inputCls}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                {errors.password && (
                                    <span className="text-[9px] text-red-500 font-bold uppercase mt-1.5 block">
                                        {errors.password}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-brand-charcoal text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-slate transition-all disabled:opacity-30"
                        >
                            {processing ? "Verifying..." : "Access Dashboard"}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-[8px] font-black uppercase tracking-[0.5em] text-white/10">
                    Authorised Personnel Only
                </p>
            </div>
        </div>
    );
}
