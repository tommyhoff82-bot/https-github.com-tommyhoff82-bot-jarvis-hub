"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  Integration,
  getIntegrations,
  connectShopify,
  connectPrintify,
  disconnectIntegration,
} from "@/lib/api";

function findIntegration(list: Integration[], platform: string) {
  return list.find((i) => i.platform === platform && i.isActive);
}

function IntegrationsContent() {
  const { token, workspaces } = useAuth();
  const workspace = workspaces[0];
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const [shopDomain, setShopDomain] = useState("");
  const [shopifyToken, setShopifyToken] = useState("");
  const [shopifyBusy, setShopifyBusy] = useState(false);
  const [shopifyError, setShopifyError] = useState<string | null>(null);

  const [printifyShopId, setPrintifyShopId] = useState("");
  const [printifyKey, setPrintifyKey] = useState("");
  const [printifyBusy, setPrintifyBusy] = useState(false);
  const [printifyError, setPrintifyError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !workspace) return;
    setLoading(true);
    try {
      setIntegrations(await getIntegrations(token, workspace.id));
    } finally {
      setLoading(false);
    }
  }, [token, workspace]);

  useEffect(() => {
    load();
  }, [load]);

  const shopify = findIntegration(integrations, "shopify");
  const printify = findIntegration(integrations, "printify");

  const handleConnectShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !workspace) return;
    setShopifyBusy(true);
    setShopifyError(null);
    try {
      await connectShopify(token, workspace.id, shopDomain, shopifyToken);
      setShopDomain("");
      setShopifyToken("");
      await load();
    } catch (err: any) {
      setShopifyError(err.message || "Couldn't connect that store");
    } finally {
      setShopifyBusy(false);
    }
  };

  const handleConnectPrintify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !workspace) return;
    setPrintifyBusy(true);
    setPrintifyError(null);
    try {
      await connectPrintify(token, workspace.id, printifyShopId, printifyKey);
      setPrintifyShopId("");
      setPrintifyKey("");
      await load();
    } catch (err: any) {
      setPrintifyError(err.message || "Couldn't connect that account");
    } finally {
      setPrintifyBusy(false);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!token || !workspace) return;
    await disconnectIntegration(token, workspace.id, platform);
    await load();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-gray-400">
            Connect {workspace?.businessName || "your workspace"}'s own store — nothing here is shared
            with other workspaces.
          </p>
        </div>
        <Link href="/dashboard" className="text-blue-400 hover:underline text-sm">← Back to dashboard</Link>
      </header>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Shopify */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Shopify
                {shopify && <span className="text-xs font-normal text-green-400">Connected — {shopify.storeId}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shopify ? (
                <Button variant="outline" onClick={() => handleDisconnect("shopify")}>Disconnect</Button>
              ) : (
                <form onSubmit={handleConnectShopify} className="space-y-3">
                  {shopifyError && <p className="text-xs text-red-400">{shopifyError}</p>}
                  <Input
                    className="bg-gray-800 border-gray-700"
                    placeholder="your-store.myshopify.com"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    required
                  />
                  <Input
                    className="bg-gray-800 border-gray-700"
                    type="password"
                    placeholder="Admin API access token"
                    value={shopifyToken}
                    onChange={(e) => setShopifyToken(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Shopify Admin → Settings → Apps and sales channels → Develop apps → create a
                    custom app with read/write products & orders scopes, then copy its Admin API
                    access token here.
                  </p>
                  <Button type="submit" className="w-full bg-blue-600" disabled={shopifyBusy}>
                    {shopifyBusy ? "Verifying…" : "Connect Shopify"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Printify */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Printify
                {printify && <span className="text-xs font-normal text-green-400">Connected — shop {printify.storeId}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {printify ? (
                <Button variant="outline" onClick={() => handleDisconnect("printify")}>Disconnect</Button>
              ) : (
                <form onSubmit={handleConnectPrintify} className="space-y-3">
                  {printifyError && <p className="text-xs text-red-400">{printifyError}</p>}
                  <Input
                    className="bg-gray-800 border-gray-700"
                    placeholder="Shop ID (from your Printify account)"
                    value={printifyShopId}
                    onChange={(e) => setPrintifyShopId(e.target.value)}
                    required
                  />
                  <Input
                    className="bg-gray-800 border-gray-700"
                    type="password"
                    placeholder="Printify API key"
                    value={printifyKey}
                    onChange={(e) => setPrintifyKey(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Printify → My Account → Connections → Generate a personal access token.
                  </p>
                  <Button type="submit" className="w-full bg-blue-600" disabled={printifyBusy}>
                    {printifyBusy ? "Verifying…" : "Connect Printify"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <RequireAuth>
      <IntegrationsContent />
    </RequireAuth>
  );
}
