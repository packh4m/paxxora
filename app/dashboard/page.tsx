import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">LooksLadder</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Welcome to your Dashboard
          </h2>
          <p className="text-zinc-400 mb-6">
            You are signed in as <span className="text-white">{user.email}</span>
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <a
              href="/"
              className="p-6 bg-zinc-800/50 rounded-xl border border-zinc-700 hover:border-amber-500/50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                Analyze Photo
              </h3>
              <p className="text-sm text-zinc-400">
                Upload a photo for facial analysis
              </p>
            </a>

            <div className="p-6 bg-zinc-800/50 rounded-xl border border-zinc-700">
              <h3 className="text-lg font-semibold text-white mb-2">
                Analysis History
              </h3>
              <p className="text-sm text-zinc-400">
                Coming soon - view your past analyses
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
