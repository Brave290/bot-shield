"use client";
import { ReactNode } from "react";
import { Crown, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

const PLAN_HIERARCHY = ["Hobby", "Pro", "Enterprise"] as const;

const PLAN_FEATURES: Record<string, string[]> = {
  Hobby: ["projects", "sdk", "analytics", "security", "simulator"],
  Pro: ["projects", "sdk", "analytics", "security", "simulator", "webhooks", "alerts", "incidents", "threats", "fingerprints", "feedback", "exports", "retention", "quota"],
  Enterprise: ["projects", "sdk", "analytics", "security", "simulator", "webhooks", "alerts", "incidents", "threats", "fingerprints", "feedback", "exports", "retention", "quota", "scanner", "waf", "proxy", "api-shield", "identity", "analytics-pro", "compliance", "test-lab", "edge", "marketplace"],
};

const PLAN_FEATURES_LIST: Record<string, string[]> = {
  Hobby: ["3 projects", "10K requests/mo", "Basic analytics", "Email support"],
  Pro: ["Unlimited projects", "100K requests/mo", "Advanced analytics", "Webhooks & alerts", "Priority support", "Team access"],
  Enterprise: ["Everything in Pro", "Unlimited requests", "Scanner & WAF", "Proxy & API Shield", "Identity & Compliance", "Edge deployment", "Marketplace access", "Dedicated support"],
};

export function hasFeatureAccess(plan: string, featureId: string): boolean {
  return PLAN_FEATURES[plan]?.includes(featureId) || false;
}

export function getRequiredPlan(featureId: string): string {
  if (PLAN_FEATURES["Enterprise"].includes(featureId)) return "Enterprise";
  if (PLAN_FEATURES["Pro"].includes(featureId)) return "Pro";
  return "Hobby";
}

interface PlanGateProps {
  feature: string;
  currentPlan: string;
  children: ReactNode;
}

export function PlanGate({ feature, currentPlan, children }: PlanGateProps) {
  if (hasFeatureAccess(currentPlan, feature)) return <>{children}</>;

  const required = getRequiredPlan(feature);
  return (
    <div className="relative">
      <div className="blur-[2px] pointer-events-none opacity-50">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/95 backdrop-blur-sm p-8 text-center max-w-sm shadow-2xl shadow-black/50">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Lock className="h-7 w-7 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Upgrade to {required}</h3>
          <p className="text-sm text-slate-400 mb-6">This feature requires the {required} plan or higher. You are currently on the {currentPlan} plan.</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Crown className="w-4 h-4" />
            View Plans
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

interface UpgradeBannerProps {
  currentPlan: string;
  requiredPlan?: string;
  feature?: string;
}

export function UpgradeBanner({ currentPlan, requiredPlan, feature }: UpgradeBannerProps) {
  const target = requiredPlan || (currentPlan === "Hobby" ? "Pro" : "Enterprise");
  if (currentPlan === "Enterprise") return null;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-blue-500/5 p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {feature ? `"${feature}" requires ${target}` : `Unlock more with ${target}`}
            </p>
            <p className="text-xs text-slate-400">You are on the {currentPlan} plan</p>
          </div>
        </div>
        <Link href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shrink-0">
          Upgrade to {target}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    Hobby: "bg-slate-800 text-slate-300",
    Pro: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Enterprise: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${colors[plan] || colors.Hobby}`}>
      <Crown className="w-3 h-3" />
      {plan}
    </span>
  );
}

export function PlanFeatures({ plan }: { plan: string }) {
  const features = PLAN_FEATURES_LIST[plan] || PLAN_FEATURES_LIST.Hobby;
  return (
    <ul className="space-y-2">
      {features.map((f) => (
        <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {f}
        </li>
      ))}
    </ul>
  );
}
