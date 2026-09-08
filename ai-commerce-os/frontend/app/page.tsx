import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Brain, Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold">CommerceOS</span>
          </div>
          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700">Start Free Trial</Button>
          </Link>
        </div>
      </nav>

      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-800 rounded-full px-4 py-2 mb-6">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Self-Learning AI • Gets Smarter Every Day</span>
          </div>

          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Your AI E-commerce Empire.<br />That Learns Automatically.
          </h1>

          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Builds stores, finds products, creates ads, fulfills orders — and gets
            smarter with every sale.
          </p>

          <Link href="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
              Start Your AI Business <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="px-6 py-24 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">The Self-Learning Advantage</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <Brain className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Learns From Every Outcome</h3>
                <p className="text-gray-400">Every decision is tracked. The system analyzes what works.</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <Sparkles className="w-12 h-12 text-pink-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Gets Smarter Over Time</h3>
                <p className="text-gray-400">After 30 days, it knows your niche better than any expert.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard tier="Starter" price="$99" features={["1 Store", "Product Scout", "Basic Learning"]} />
            <PricingCard tier="Pro" price="$299" features={["3 Stores", "All Agents", "Advanced Learning"]} highlighted />
            <PricingCard tier="Enterprise" price="$999" features={["Unlimited", "Custom Training", "Priority"]} />
          </div>
        </div>
      </section>

      <footer className="px-6 py-12 border-t border-gray-800 text-center text-gray-500">
        © 2026 CommerceOS
      </footer>
    </div>
  );
}

function PricingCard({ tier, price, features, highlighted }: any) {
  return (
    <Card className={`bg-gray-900 border-gray-800 ${highlighted ? 'ring-2 ring-purple-500' : ''}`}>
      <CardContent className="pt-6">
        <h3 className="text-2xl font-bold mb-2">{tier}</h3>
        <div className="mb-6">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-gray-400">/month</span>
        </div>
        <ul className="space-y-3 mb-6">
          {features.map((f: string, i: number) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />{f}
            </li>
          ))}
        </ul>
        <Button className="w-full" variant={highlighted ? "default" : "outline"}>Get Started</Button>
      </CardContent>
    </Card>
  );
}
