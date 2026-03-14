import React from "react";
import { Head, useForm } from "@inertiajs/react";

export default function AdminLogin({ sessionExpired }: { sessionExpired?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("admin.login"));
    };

    const inputCls =
        "w-full border-0 border-b border-gray-200 focus:border-brand-charcoal focus:ring-0 px-0 py-4 text-sm bg-transparent placeholder:text-gray-300 transition-colors outline-none";
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

                {/* Session expired notice */}
                {sessionExpired && (
                    <div className="mb-6 border border-amber-400/30 bg-amber-400/10 px-5 py-4 flex items-center gap-3">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                            {sessionExpired}
                        </p>
                    </div>
                )}

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
                            <div>
                                <label className={labelCls}>Email Address</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData("email", e.target.value)}
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

                            <div>
                                <label className={labelCls}>Password</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData("password", e.target.value)}
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

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-brand-charcoal text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-slate transition-all disabled:opacity-30"
                            >
                                {processing ? "Verifying..." : "Access Dashboard"}
                            </button>

                            {/* Session info */}
                            <p className="text-center text-[8px] font-bold uppercase tracking-widest text-brand-slate/20">
                                Sessions expire after 3 hours of inactivity
                            </p>
                        </div>
                    </form>
                </div>

                <p className="text-center mt-8 text-[8px] font-black uppercase tracking-[0.5em] text-white/10">
                    Authorised Personnel Only
                </p>
            </div>
        </div>
    );
}
