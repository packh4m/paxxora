import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const firstName = user.user_metadata?.full_name?.split(" ")[0] || null;

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <Link href="/" className="text-lg font-semibold text-black tracking-tight">
          Paxxora
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-6">
            Your analysis awaits
          </p>

          <h1 className="text-4xl md:text-5xl font-semibold text-black tracking-tight leading-tight mb-5">
            {firstName ? `Ready to see the truth, ${firstName}?` : "Are you ready to see the truth?"}
          </h1>

          <p className="text-zinc-500 text-base mb-10 max-w-sm mx-auto leading-relaxed">
            52 landmark points. 33 metrics. No flattery. Just an honest breakdown of your facial structure.
          </p>

          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-black hover:bg-zinc-800 text-white text-sm font-medium rounded-full transition-colors"
          >
            Start My Analysis
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-xs text-zinc-400 mt-5 font-mono">
            No credit card required — your first scan is free
          </p>
        </div>
      </main>
    </div>
  );
}