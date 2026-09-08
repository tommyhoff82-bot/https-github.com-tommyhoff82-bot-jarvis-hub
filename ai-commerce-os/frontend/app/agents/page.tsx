"use client";
import { useState } from "react";
import { Search, Brain } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentTaskList } from "@/components/agents/AgentTaskList";
import Link from "next/link";

function AgentsPageContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-gray-400">Run them on demand, or wire up a scheduler for a hands-off cadence.</p>
        </div>
        <Link href="/dashboard" className="text-blue-400 hover:underline text-sm">← Back to dashboard</Link>
      </header>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <AgentCard
          agentType="scout"
          icon={<Search className="w-8 h-8" />}
          name="Scout"
          description="Researches trending products for your niche, checks past learnings first, and drafts Shopify-ready listings."
          onTriggered={bumpRefresh}
        />
        <AgentCard
          agentType="learner"
          icon={<Brain className="w-8 h-8" />}
          name="Pattern Analyzer"
          description="Reviews the last 30 days of decisions with a recorded outcome and distills what's actually working into reusable learnings."
          onTriggered={bumpRefresh}
        />
      </div>

      <AgentTaskList refreshKey={refreshKey} />
    </div>
  );
}

export default function AgentsPage() {
  return (
    <RequireAuth>
      <AgentsPageContent />
    </RequireAuth>
  );
}
