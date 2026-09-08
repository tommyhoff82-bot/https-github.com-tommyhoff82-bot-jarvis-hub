"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getBillingPlans, createCheckoutSession, Plan } from "@/lib/api";

function BillingPageContent() {
  const { token, workspaces } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOutTier, setCheckingOutTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workspace = workspaces[0];

  useEffect(() => {
    getBillingPlans().then(setPlans).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: Plan) => {
    if (!token || !workspace || !plan.price_id) return;
    setCheckingOutTier(plan.tier);
    setError(null);
    try {
      const { checkout_url } = await createCheckoutSession(token, workspace.id, plan.price_id);
      window.location.href = checkout_url;
    } catch (err: any) {
      setError(err.message || "Couldn't start checkout");
      setCheckingOutTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-gray-400">
            Current plan: <span className="text-white font-medium capitalize">{workspace?.subscriptionTier}</span>
          </p>
        </div>
        <Link href="/dashboard" className="text-blue-400 hover:underline text-sm">← Back to dashboard</Link>
      </header>

      {error && <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2 mb-6">{error}</p>}

      {loading ? (
        <p className="text-gray-400">Loading plans…</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = workspace?.subscriptionTier === plan.tier;
            return (
              <Card key={plan.tier} className={`bg-gray-900 border-gray-800 ${plan.highlighted ? "ring-2 ring-purple-500" : ""}`}>
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    disabled={isCurrent || !plan.price_id || checkingOutTier === plan.tier}
                    onClick={() => handleUpgrade(plan)}
                  >
                    {isCurrent
                      ? "Current Plan"
                      : !plan.price_id
                      ? "Not configured"
                      : checkingOutTier === plan.tier
                      ? "Redirecting…"
                      : "Upgrade"}
                  </Button>
                  {!plan.price_id && !isCurrent && (
                    <p className="text-xs text-gray-500 mt-2">
                      Set STRIPE_PRICE_{plan.tier.toUpperCase()} in backend/.env to enable this plan.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <RequireAuth>
      <BillingPageContent />
    </RequireAuth>
  );
}
