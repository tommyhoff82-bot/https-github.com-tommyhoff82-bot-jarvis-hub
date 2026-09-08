const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function createWorkspace(businessName: string, niche: string, userId: string) {
  const res = await fetch(`${API_URL}/api/workspaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ business_name: businessName, niche, user_id: userId }),
  });
  return res.json();
}

export async function getAgentTasks(workspaceId: string) {
  const res = await fetch(`${API_URL}/api/agents/tasks?workspace_id=${workspaceId}`);
  return res.json();
}

export async function getSystemInsights(workspaceId: string) {
  const res = await fetch(`${API_URL}/api/learning/insights?workspace_id=${workspaceId}`);
  return res.json();
}
