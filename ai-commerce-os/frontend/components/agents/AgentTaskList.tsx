"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getAgentTasks } from "@/lib/api";

interface AgentTask {
  id: string;
  agentType: string;
  actionType: string;
  status: string;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  completed: "text-green-400",
  pending: "text-yellow-400",
  failed: "text-red-400",
};

export function AgentTaskList({ refreshKey }: { refreshKey?: number }) {
  const { token, workspaces } = useAuth();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const workspaceId = workspaces[0]?.id;

  const load = useCallback(async () => {
    if (!token || !workspaceId) return;
    setLoading(true);
    try {
      const data = await getAgentTasks(token, workspaceId);
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, [token, workspaceId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Agent Activity</CardTitle>
        <Button variant="outline" size="default" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-sm">No agent runs yet — trigger Scout or Learner above to get started.</p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between border-b border-gray-800 pb-2 last:border-0">
                <div>
                  <span className="font-medium capitalize">{t.agentType}</span>
                  <span className="text-gray-400 text-sm"> — {t.actionType}</span>
                </div>
                <span className={`text-xs font-medium ${STATUS_COLOR[t.status] || "text-gray-400"}`}>
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
