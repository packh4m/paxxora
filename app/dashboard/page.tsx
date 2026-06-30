import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="sticky top-0 z-10 bg-[#f7f7f5]/80 backdrop-blur-lg border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-black tracking-tight">
            Paxxora
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-black tracking-tight mb-2">
            Welcome to your dashboard
          </h2>
          <p className="text-zinc-500 mb-8 text-sm">
            You are signed in as <span className="text-black">{user.email}</span>
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/analyze"
              className="p-6 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-black/30 hover:bg-white transition-colors"
            >
              <h3 className="text-base font-medium text-black mb-1.5">
                Analyze Photo
              </h3>
              <p className="text-sm text-zinc-500">
                Upload a photo for facial analysis
              </p>
            </Link>

            <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200 opacity-60">
              <h3 className="text-base font-medium text-black mb-1.5">
                Analysis History
              </h3>
              <p className="text-sm text-zinc-500">
                Coming soon — view your past analyses
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}