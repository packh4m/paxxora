"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AuthPage() {
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col">
      <nav className="flex items-center px-8 py-6">
        <Link href="/" className="text-black text-lg font-semibold tracking-tight">
          Paxxora
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7c0-1.1.9-2 2-2h1.5M21 7c0-1.1-.9-2-2-2h-1.5M3 17c0 1.1.9 2 2 2h1.5M21 17c0 1.1-.9 2-2 2h-1.5"/>
              <circle cx="12" cy="12" r="4"/>
              <path d="M9 9l1.5 1.5M15 9l-1.5 1.5M9 15l1.5-1.5M15 15l-1.5-1.5"/>
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-black tracking-tight mb-1">
            Sign in to Paxxora
          </h1>
          <p className="text-zinc-500 text-sm mb-7">
            Continue with your Google account
          </p>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-zinc-50 text-black text-sm font-medium rounded-xl border border-zinc-200 transition-colors shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          {error && <p className="text-xs text-red-500 mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
}