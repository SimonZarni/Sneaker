import React, { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Head title="Create Account — Walker Sneaker Store" />

            {/* ── NAVBAR (green, matches site) ── */}
            <nav className="w-full bg-brand-charcoal h-14 flex items-center px-6 shadow-sm flex-shrink-0">
                <Link href="/" className="text-white font-bold text-base tracking-tight">
                    Walker Sneaker Store
                </Link>
                <div className="ml-auto flex items-center gap-6">
                    <Link href={route("home")} className="text-white/70 text-sm hover:text-white transition-colors">Home</Link>
                    <Link href={route("about")} className="text-white/70 text-sm hover:text-white transition-colors">About</Link>
                    <Link href={route("shop.index")} className="text-white/70 text-sm hover:text-white transition-colors">Shop</Link>
                </div>
            </nav>

            {/* ── FORM CENTERED ── */}
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-sm">

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-black uppercase tracking-tight text-brand-charcoal mb-1">Create Account</h1>
                        <p className="text-xs text-gray-400">Join the Walker Sneaker Store community</p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">

                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={e => setData("name", e.target.value)}
                                autoComplete="name"
                                autoFocus
                                placeholder="Your name"
                                className="w-full border border-gray-200 focus:border-brand-charcoal bg-white px-4 py-3 text-sm outline-none transition-colors rounded-sm placeholder:text-gray-300"
                            />
                            {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={e => setData("email", e.target.value)}
                                autoComplete="username"
                                placeholder="you@example.com"
                                className="w-full border border-gray-200 focus:border-brand-charcoal bg-white px-4 py-3 text-sm outline-none transition-colors rounded-sm placeholder:text-gray-300"
                            />
                            {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={e => setData("password", e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className="w-full border border-gray-200 focus:border-brand-charcoal bg-white px-4 py-3 text-sm outline-none transition-colors rounded-sm placeholder:text-gray-300 pr-10"
                                />
                                <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-brand-charcoal transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        {showPassword
                                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                                        }
                                    </svg>
                                </button>
                            </div>
                            {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showPasswordConfirm ? "text" : "password"}
                                    value={data.password_confirmation}
                                    onChange={e => setData("password_confirmation", e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className="w-full border border-gray-200 focus:border-brand-charcoal bg-white px-4 py-3 text-sm outline-none transition-colors rounded-sm placeholder:text-gray-300 pr-10"
                                />
                                <button type="button" onClick={() => setShowPasswordConfirm(v => !v)} tabIndex={-1}
                                    aria-label={showPasswordConfirm ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-brand-charcoal transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        {showPasswordConfirm
                                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                                        }
                                    </svg>
                                </button>
                            </div>
                            {errors.password_confirmation && <p className="mt-1.5 text-xs text-red-500">{errors.password_confirmation}</p>}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-brand-charcoal text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-brand-slate transition-colors disabled:opacity-40 rounded-sm mt-2"
                        >
                            {processing ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    {/* Login link */}
                    <p className="mt-6 text-center text-xs text-gray-400">
                        Already have an account?{" "}
                        <Link href={route("login")} className="text-brand-charcoal font-bold hover:text-brand-slate transition-colors">
                            Sign in
                        </Link>
                    </p>
                    <div className="mt-4 text-center">
                        <Link href={route("home")} className="text-xs text-gray-300 hover:text-gray-500 transition-colors">
                            ← Back to store
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
