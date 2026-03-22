// import React, { useState } from "react";
// import { Head, Link, useForm } from "@inertiajs/react";

// export default function Login({
//     status,
//     canResetPassword,
// }: {
//     status?: string;
//     canResetPassword: boolean;
// }) {
//     const { data, setData, post, processing, errors, reset } = useForm({
//         email: "",
//         password: "",
//         remember: false as boolean,
//     });

//     const [showPassword, setShowPassword] = useState(false);

//     const submit = (e: React.FormEvent) => {
//         e.preventDefault();
//         post(route("login"), {
//             onFinish: () => reset("password"),
//         });
//     };

//     return (
//         <div className="min-h-screen bg-brand-white flex">
//             <Head title="Sign In — SNEAKER.DRP" />

//             {/* ── Left panel: branding ── */}
//             <div className="hidden lg:flex lg:w-1/2 bg-brand-charcoal flex-col justify-between p-16">
//                 <Link href="/" className="text-2xl font-black tracking-tightest uppercase text-white">
//                     SNEAKER.DRP
//                 </Link>

//                 <div>
//                     <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-6">
//                         The Archive
//                     </p>
//                     <h2 className="text-5xl font-black uppercase tracking-tightest text-white leading-none">
//                         Exclusive<br />Drops.<br />Verified<br />Always.
//                     </h2>
//                 </div>

//                 <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10">
//                     Members Only Access
//                 </p>
//             </div>

//             {/* ── Right panel: form ── */}
//             <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16">
//                 <div className="w-full max-w-sm">

//                     {/* Mobile logo */}
//                     <div className="lg:hidden mb-12 text-center">
//                         <Link href="/" className="text-2xl font-black tracking-tightest uppercase text-brand-charcoal">
//                             SNEAKER.DRP
//                         </Link>
//                     </div>

//                     {/* Header */}
//                     <div className="mb-12">
//                         <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/30 mb-2">
//                             Welcome Back
//                         </p>
//                         <h1 className="text-3xl font-black uppercase tracking-tightest">
//                             Sign In
//                         </h1>
//                     </div>

//                     {/* Status message (e.g. password reset success) */}
//                     {status && (
//                         <div className="mb-8 border border-emerald-200 bg-emerald-50 px-5 py-4">
//                             <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
//                                 {status}
//                             </p>
//                         </div>
//                     )}

//                     <form onSubmit={submit} className="space-y-8">

//                         {/* Email */}
//                         <div>
//                             <label className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/40 block mb-3">
//                                 Email Address
//                             </label>
//                             <input
//                                 type="email"
//                                 value={data.email}
//                                 onChange={e => setData("email", e.target.value)}
//                                 autoComplete="email"
//                                 autoFocus
//                                 placeholder="you@example.com"
//                                 className="w-full border-0 border-b-2 border-brand-surface focus:border-brand-charcoal bg-transparent px-0 py-3 text-sm font-medium outline-none transition-colors placeholder:text-brand-slate/20"
//                             />
//                             {errors.email && (
//                                 errors.email.includes('suspended') ? (
//                                     <div className="mt-3 border border-amber-200 bg-amber-50 px-4 py-3">
//                                         <p className="text-[9px] font-black uppercase tracking-wide text-amber-700">
//                                             {errors.email}
//                                         </p>
//                                         <a href="mailto:support@sneaker.drp" className="text-[9px] font-black uppercase tracking-wide text-amber-600 border-b border-amber-400 mt-1 inline-block">
//                                             Contact Support →
//                                         </a>
//                                     </div>
//                                 ) : (
//                                     <p className="mt-2 text-[9px] font-black uppercase tracking-wide text-red-500">
//                                         {errors.email}
//                                     </p>
//                                 )
//                             )}
//                         </div>

//                         {/* Password */}
//                         <div>
//                             <div className="flex items-center justify-between mb-3">
//                                 <label className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/40">
//                                     Password
//                                 </label>
//                                 {canResetPassword && (
//                                     <Link
//                                         href={route("password.request")}
//                                         className="text-[8px] font-black uppercase tracking-widest text-brand-slate/30 hover:text-brand-charcoal transition-colors border-b border-transparent hover:border-brand-charcoal pb-px"
//                                     >
//                                         Forgot?
//                                     </Link>
//                                 )}
//                             </div>
//                             <div className="relative">
//                                 <input
//                                     type={showPassword ? "text" : "password"}
//                                     value={data.password}
//                                     onChange={e => setData("password", e.target.value)}
//                                     autoComplete="current-password"
//                                     placeholder="••••••••"
//                                     className="w-full border-0 border-b-2 border-brand-surface focus:border-brand-charcoal bg-transparent px-0 py-3 text-sm font-medium outline-none transition-colors placeholder:text-brand-slate/20 pr-10"
//                                 />
//                                 <button
//                                     type="button"
//                                     onClick={() => setShowPassword(v => !v)}
//                                     className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-slate/30 hover:text-brand-charcoal transition-colors"
//                                     tabIndex={-1}
//                                 >
//                                     {showPassword ? (
//                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
//                                             <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
//                                         </svg>
//                                     ) : (
//                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
//                                             <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
//                                             <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                                         </svg>
//                                     )}
//                                 </button>
//                             </div>
//                             {errors.password && (
//                                 <p className="mt-2 text-[9px] font-black uppercase tracking-wide text-red-500">
//                                     {errors.password}
//                                 </p>
//                             )}
//                         </div>

//                         {/* Remember me */}
//                         <label className="flex items-center gap-3 cursor-pointer group">
//                             <input
//                                 type="checkbox"
//                                 className="sr-only"
//                                 checked={data.remember}
//                                 onChange={e => setData("remember", e.target.checked)}
//                             />
//                             <div className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 transition-colors pointer-events-none ${
//                                 data.remember
//                                     ? "border-brand-charcoal bg-brand-charcoal"
//                                     : "border-brand-surface group-hover:border-brand-slate/40"
//                             }`}>
//                                 {data.remember && (
//                                     <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
//                                         <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
//                                     </svg>
//                                 )}
//                             </div>
//                             <span className="text-[9px] font-black uppercase tracking-widest text-brand-slate/40 group-hover:text-brand-slate/60 transition-colors">
//                                 Remember me
//                             </span>
//                         </label>

//                         {/* Submit */}
//                         <button
//                             type="submit"
//                             disabled={processing}
//                             className="w-full bg-brand-charcoal text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-slate transition-colors disabled:opacity-30"
//                         >
//                             {processing ? "Signing In..." : "Sign In"}
//                         </button>
//                     </form>

//                     {/* Register link */}
//                     <p className="mt-10 text-center text-[9px] font-bold uppercase tracking-widest text-brand-slate/30">
//                         No account?{" "}
//                         <Link
//                             href={route("register")}
//                             className="text-brand-charcoal border-b border-brand-charcoal pb-px hover:text-brand-slate hover:border-brand-slate transition-colors"
//                         >
//                             Create one
//                         </Link>
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// }

import React, { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false as boolean,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <div className="min-h-screen bg-brand-white flex">
            <Head title="Sign In — SNEAKER.DRP" />

            {/* ── Left panel: branding ── */}
            <div className="hidden lg:flex lg:w-1/2 bg-brand-charcoal flex-col justify-between p-16">
                <Link href="/" className="text-2xl font-black tracking-tightest uppercase text-white">
                    SNEAKER.DRP
                </Link>

                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mb-6">
                        The Archive
                    </p>
                    <h2 className="text-5xl font-black uppercase tracking-tightest text-white leading-none">
                        Exclusive<br />Drops.<br />Verified<br />Always.
                    </h2>
                </div>

                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10">
                    Members Only Access
                </p>
            </div>

            {/* ── Right panel: form ── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16">
                <div className="w-full max-w-sm">

                    {/* Mobile logo */}
                    <div className="lg:hidden mb-12 text-center">
                        <Link href="/" className="text-2xl font-black tracking-tightest uppercase text-brand-charcoal">
                            SNEAKER.DRP
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-12">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-slate/30 mb-2">
                            Welcome Back
                        </p>
                        <h1 className="text-3xl font-black uppercase tracking-tightest">
                            Sign In
                        </h1>
                    </div>

                    {/* Status message (e.g. password reset success) */}
                    {status && (
                        <div className="mb-8 border border-emerald-200 bg-emerald-50 px-5 py-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
                                {status}
                            </p>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-8">

                        {/* ── Google OAuth ── */}
                        <a
                            href="/auth/google"
                            className="flex items-center justify-center gap-3 w-full border-2 border-brand-surface hover:border-brand-charcoal py-4 text-[10px] font-black uppercase tracking-[0.3em] text-brand-charcoal transition-colors group"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </a>

                        {/* Divider */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-brand-surface" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-brand-slate/25">or</span>
                            <div className="flex-1 h-px bg-brand-surface" />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/40 block mb-3">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={e => setData("email", e.target.value)}
                                autoComplete="email"
                                autoFocus
                                placeholder="you@example.com"
                                className="w-full border-0 border-b-2 border-brand-surface focus:border-brand-charcoal bg-transparent px-0 py-3 text-sm font-medium outline-none transition-colors placeholder:text-brand-slate/20"
                            />
                            {errors.email && (
                                errors.email.includes('suspended') ? (
                                    <div className="mt-3 border border-amber-200 bg-amber-50 px-4 py-3">
                                        <p className="text-[9px] font-black uppercase tracking-wide text-amber-700">
                                            {errors.email}
                                        </p>
                                        <a href="mailto:support@sneaker.drp" className="text-[9px] font-black uppercase tracking-wide text-amber-600 border-b border-amber-400 mt-1 inline-block">
                                            Contact Support →
                                        </a>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-[9px] font-black uppercase tracking-wide text-red-500">
                                        {errors.email}
                                    </p>
                                )
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/40">
                                    Password
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={route("password.request")}
                                        className="text-[8px] font-black uppercase tracking-widest text-brand-slate/30 hover:text-brand-charcoal transition-colors border-b border-transparent hover:border-brand-charcoal pb-px"
                                    >
                                        Forgot?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={e => setData("password", e.target.value)}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="w-full border-0 border-b-2 border-brand-surface focus:border-brand-charcoal bg-transparent px-0 py-3 text-sm font-medium outline-none transition-colors placeholder:text-brand-slate/20 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-slate/30 hover:text-brand-charcoal transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-[9px] font-black uppercase tracking-wide text-red-500">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Remember me */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={data.remember}
                                onChange={e => setData("remember", e.target.checked)}
                            />
                            <div className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 transition-colors pointer-events-none ${
                                data.remember
                                    ? "border-brand-charcoal bg-brand-charcoal"
                                    : "border-brand-surface group-hover:border-brand-slate/40"
                            }`}>
                                {data.remember && (
                                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-slate/40 group-hover:text-brand-slate/60 transition-colors">
                                Remember me
                            </span>
                        </label>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-brand-charcoal text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-slate transition-colors disabled:opacity-30"
                        >
                            {processing ? "Signing In..." : "Sign In"}
                        </button>
                    </form>

                    {/* Register link */}
                    <p className="mt-10 text-center text-[9px] font-bold uppercase tracking-widest text-brand-slate/30">
                        No account?{" "}
                        <Link
                            href={route("register")}
                            className="text-brand-charcoal border-b border-brand-charcoal pb-px hover:text-brand-slate hover:border-brand-slate transition-colors"
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
