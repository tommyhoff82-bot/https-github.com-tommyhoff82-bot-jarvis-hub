import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, ShoppingBag, TrendingUp, DollarSign, Brain, Sparkles } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <aside className="w-64 bg-gray-900 p-6 border-r border-gray-800">
        <h1 className="text-2xl font-bold text-blue-400 mb-8">CommerceOS</h1>
        <nav className="space-y-2">
          <a href="#" className="block p-2 rounded hover:bg-gray-800">Dashboard</a>
          <a href="#" className="block p-2 rounded hover:bg-gray-800">AI Agents</a>
          <a href="#" className="block p-2 rounded hover:bg-gray-800">🧠 Learnings</a>
          <a href="#" className="block p-2 rounded hover:bg-gray-800">Products</a>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold">Welcome back 👋</h2>
          <p className="text-gray-400">Your AI team is learning 24/7.</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard icon={<DollarSign />} title="Revenue" value="$12,450" trend="+14%" />
          <StatCard icon={<ShoppingBag />} title="Orders" value="342" trend="+8%" />
          <StatCard icon={<TrendingUp />} title="ROAS" value="3.2x" trend="+0.4x" />
          <StatCard icon={<Brain />} title="Learnings" value="847" trend="Active" />
        </div>

        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Self-Learning Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <InsightCard title="Conversion" value="+18%" description="Eco-friendly products convert better" />
              <InsightCard title="Ads" value="2.1x" description="Question hooks outperform" />
              <InsightCard title="Pricing" value="$40-$80" description="Highest ROAS range" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader><CardTitle>Command Center</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full bg-blue-600">🔍 Run Product Scout</Button>
            <Button className="w-full bg-gray-800">🎨 Generate Ad Creatives</Button>
            <Button className="w-full bg-purple-600">🧠 Analyze Patterns</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, trend }: any) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-gray-400">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-green-400">{trend}</p>
      </CardContent>
    </Card>
  );
}

function InsightCard({ title, value, description }: any) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-4 border border-purple-800">
      <div className="text-sm text-purple-300 mb-1">{title}</div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-xs text-gray-400">{description}</div>
    </div>
  );
}
