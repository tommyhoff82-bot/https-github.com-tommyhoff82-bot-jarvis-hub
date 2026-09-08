"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { login } = useAuth();
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
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border border-gray-800 space-y-4">
        <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full bg-blue-600" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
        <p className="text-sm text-gray-400 text-center">
          Don't have an account? <Link href="/signup" className="text-blue-400 hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
