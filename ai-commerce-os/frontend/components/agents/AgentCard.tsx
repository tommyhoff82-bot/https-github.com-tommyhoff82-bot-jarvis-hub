"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { triggerAgent } from "@/lib/api";

interface AgentCardProps {
  agentType: "scout" | "learner";
  icon: React.ReactNode;
  name: string;
  description: string;
  onTriggered?: () => void;
}

export function AgentCard({ agentType, icon, name, description, onTriggered }: AgentCardProps) {
  const { token, workspaces } = useAuth();
  const [status, setStatus] = useState<"idle" | "running" | "started">("idle");
  const [error, setError] = useState<string | null>(null);
  const workspaceId = workspaces[0]?.id;

  const handleRun = async () => {
    if (!token || !workspaceId) return;
    setStatus("running");
    setError(null);
    try {
      await triggerAgent(token, workspaceId, agentType);
      setStatus("started");
      onTriggered?.();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setError(err.message || "Couldn't start the agent");
      setStatus("idle");
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="pt-6">
        <div className="mb-4 text-blue-400">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-gray-400 text-sm mb-4">{description}</p>
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <Button onClick={handleRun} disabled={status !== "idle"} className="w-full bg-blue-600">
          {status === "running" ? "Starting..." : status === "started" ? "✅ Running in background" : "Run Now"}
        </Button>
      </CardContent>
    </Card>
  );
}
