"use client";
import { useState } from "react";
import { createWorkspace } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequireAuth } from "@/components/RequireAuth";

function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [niche, setNiche] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, refresh } = useAuth();
  const router = useRouter();

  const handleLaunch = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      await createWorkspace(token, businessName, niche);
      await refresh();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Couldn't create your workspace");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border border-gray-800">
        <h1 className="text-2xl font-bold mb-6 text-center">Let's build your empire.</h1>
        {error && <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2 mb-4">{error}</p>}
        {step === 1 ? (
          <div className="space-y-4">
            <Input
              className="bg-gray-800 border-gray-700"
              placeholder="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
            <Button className="w-full bg-blue-600" onClick={() => setStep(2)} disabled={!businessName}>
              Next
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              className="bg-gray-800 border-gray-700"
              placeholder="Target Niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
            <Button className="w-full bg-blue-600" onClick={handleLaunch} disabled={!niche || isLoading}>
              {isLoading ? "Building..." : "🚀 Launch My AI Business"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Onboarding() {
  return (
    <RequireAuth requireWorkspace={false}>
      <OnboardingForm />
    </RequireAuth>
  );
}
