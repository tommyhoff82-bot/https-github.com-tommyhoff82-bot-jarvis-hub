"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, TrendingUp, DollarSign, Brain, Sparkles, LogOut } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { getSystemInsights, triggerAgent } from "@/lib/api";

interface Insights {
  total_decisions: number;
  success_rate: number;
  top_learnings: { lesson: string }[];
  improvement_over_time: string;
}

function DashboardContent() {
  const { token, workspaces, user, logout } = useAuth();
  const workspace = workspaces[0];
  const [insights, setInsights] = useState<Insights | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !workspace) return;
    getSystemInsights(token, workspace.id).then(setInsights).catch(() => {});
  }, [token, workspace]);

  const runAgent = async (agentType: "scout" | "learner") => {
    if (!token || !workspace) return;
    setTriggering(agentType);
    try {
      await triggerAgent(token, workspace.id, agentType);
    } finally {
      setTimeout(() => setTriggering(null), 1500);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <aside className="w-64 bg-gray-900 p-6 border-r border-gray-800 flex flex-col">
        <h1 className="text-2xl font-bold text-blue-400 mb-8">CommerceOS</h1>
        <nav className="space-y-2 flex-1">
          <Link href="/dashboard" className="block p-2 rounded hover:bg-gray-800">Dashboard</Link>
          <Link href="/agents" className="block p-2 rounded hover:bg-gray-800">AI Agents</Link>
          <Link href="/billing" className="block p-2 rounded hover:bg-gray-800">Billing</Link>
          <Link href="/settings/integrations" className="block p-2 rounded hover:bg-gray-800">Integrations</Link>
        </nav>
        <div className="border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-500 mb-2 truncate">{user?.email}</p>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold">Welcome back 👋</h2>
          <p className="text-gray-400">{workspace?.businessName} · {workspace?.niche}</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatCard icon={<ShoppingBag />} title="Decisions Tracked" value={String(insights?.total_decisions ?? "—")} />
          <StatCard icon={<TrendingUp />} title="Success Rate" value={insights ? `${Math.round(insights.success_rate * 100)}%` : "—"} />
          <StatCard icon={<DollarSign />} title="Plan" value={workspace?.subscriptionTier ?? "—"} />
        </div>

        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Self-Learning Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights && insights.top_learnings.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {insights.top_learnings.map((l, i) => (
                  <div key={i} className="bg-gray-900/50 rounded-lg p-4 border border-purple-800">
                    <div className="text-sm text-gray-300">{l.lesson}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">{insights?.improvement_over_time || "Loading…"}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" />Command Center</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full bg-blue-600" onClick={() => runAgent("scout")} disabled={triggering === "scout"}>
              {triggering === "scout" ? "Starting…" : "🔍 Run Product Scout"}
            </Button>
            <Button className="w-full bg-purple-600" onClick={() => runAgent("learner")} disabled={triggering === "learner"}>
              {triggering === "learner" ? "Starting…" : "🧠 Analyze Patterns"}
            </Button>
            <Link href="/agents">
              <Button variant="outline" className="w-full">View Agent Activity →</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-gray-400">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold capitalize">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
