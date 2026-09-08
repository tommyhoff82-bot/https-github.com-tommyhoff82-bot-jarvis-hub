"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * Wrap any page that needs a logged-in user (and usually a workspace) with
 * this. Redirects to /login if there's no session, or to /onboarding if
 * the user hasn't created a business yet — set `requireWorkspace={false}`
 * for pages (like onboarding itself) that don't need one.
 */
export function RequireAuth({
  children,
  requireWorkspace = true,
}: {
  children: React.ReactNode;
  requireWorkspace?: boolean;
}) {
  const { loading, user, workspaces } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requireWorkspace && workspaces.length === 0) {
      router.replace("/onboarding");
    }
  }, [loading, user, workspaces, requireWorkspace, router]);

  if (loading || !user || (requireWorkspace && workspaces.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
