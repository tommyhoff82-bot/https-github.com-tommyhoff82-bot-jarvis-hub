"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signup(email, password);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border border-gray-800 space-y-4">
        <h1 className="text-2xl font-bold text-center mb-2">Create your account</h1>
        {error && <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">{error}</p>}
        <Input
          type="email"
          className="bg-gray-800 border-gray-700"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          className="bg-gray-800 border-gray-700"
          placeholder="Password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <Button type="submit" className="w-full bg-blue-600" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
        <p className="text-sm text-gray-400 text-center">
          Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
