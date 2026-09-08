"use client";
import { useState } from "react";
import { createWorkspace } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [niche, setNiche] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLaunch = async () => {
    setIsLoading(true);
    await createWorkspace(businessName, niche, "user_123");
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border border-gray-800">
        <h1 className="text-2xl font-bold mb-6 text-center">Let's build your empire.</h1>
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
