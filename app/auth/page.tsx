"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) setError(error.message);
        else setMessage("Check your email for the confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        else { router.push("/dashboard"); router.refresh(); }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center px-8 py-6">
        <Link href="/" className="text-black text-lg font-semibold tracking-tight">
          Paxxora
        </Link>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-black tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-zinc-500 mt-2 text-sm">
              {isSignUp
                ? "Start your free facial analysis."
                : "Sign in to access your results."}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-7 shadow-sm">
            {/* Google */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-zinc-50 text-black text-sm font-medium rounded-xl border border-zinc-200 transition-colors mb-5"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-zinc-100" />
              <span className="text-xs text-zinc-400">or</span>
              <div className="flex-1 h-px bg-zinc-100" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
              {message && <p className="text-xs text-green-600">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {loading
                  ? isSignUp ? "Creating account..." : "Signing in..."
                  : isSignUp ? "Create Account" : "Sign In"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
                className="text-xs text-zinc-400 hover:text-black transition-colors"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-400 mt-5">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}