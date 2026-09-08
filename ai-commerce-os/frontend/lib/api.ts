const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch(path: string, options: RequestInit & { token?: string | null } = {}) {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Request failed (${res.status})`);
  }
  return data;
}

// --- Auth ---

export async function signup(email: string, password: string) {
  return apiFetch("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function login(email: string, password: string) {
  return apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function getMe(token: string) {
  return apiFetch("/api/auth/me", { token });
}

// --- Workspaces ---

export async function createWorkspace(token: string, businessName: string, niche: string) {
  return apiFetch("/api/workspaces", {
    method: "POST",
    token,
    body: JSON.stringify({ business_name: businessName, niche }),
  });
}

// --- Agents ---

export async function getAgentTasks(token: string, workspaceId: string) {
  return apiFetch(`/api/agents/tasks?workspace_id=${encodeURIComponent(workspaceId)}`, { token });
}

export async function triggerAgent(token: string, workspaceId: string, agentType: "scout" | "learner") {
  return apiFetch("/api/agents/trigger", {
    method: "POST",
    token,
    body: JSON.stringify({ workspace_id: workspaceId, agent_type: agentType }),
  });
}

export async function getSystemInsights(token: string, workspaceId: string) {
  return apiFetch(`/api/learning/insights?workspace_id=${encodeURIComponent(workspaceId)}`, { token });
}

// --- Billing ---

export interface Plan {
  tier: string;
  name: string;
  price: number;
  features: string[];
  highlighted: boolean;
  price_id: string | null;
}

export async function getBillingPlans(): Promise<Plan[]> {
  return apiFetch("/api/billing/plans");
}

export async function createCheckoutSession(token: string, workspaceId: string, priceId: string) {
  const params = new URLSearchParams({ workspace_id: workspaceId, price_id: priceId });
  return apiFetch(`/api/billing/checkout?${params.toString()}`, { method: "POST", token });
}
