"use client";

import { useState, ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Shield, Settings, LogOut, Menu, X, Users, FileText,
  BarChart3, Code2, Bell, AlertTriangle, Globe, Lock, Zap, Target,
  FlaskConical, ShoppingBag, ClipboardCheck, Cloud, ChevronRight, Crown
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BackButton } from "@/components/back-button";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  id: string;
  badge?: string;
  pro?: boolean;
}

interface DashboardShellProps {
  children: ReactNode;
  userType: "user" | "admin";
  userName?: string;
  userPlan?: string;
  onLogout?: () => void;
}

const coreNav: NavItem[] = [
  { id: "projects", label: "Projects", href: "/dashboard", icon: Shield },
  { id: "sdk", label: "SDK & Integration", href: "/dashboard?tab=sdk", icon: Code2 },
  { id: "analytics", label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

const securityNav: NavItem[] = [
  { id: "security", label: "Security Center", href: "/dashboard/security", icon: Lock },
  { id: "simulator", label: "Rules Simulator", href: "/dashboard/simulator", icon: FlaskConical },
  { id: "threats", label: "Threat Lists", href: "/dashboard/threats", icon: AlertTriangle },
  { id: "fingerprints", label: "Fingerprints", href: "/dashboard/fingerprints", icon: Target },
];

const operationsNav: NavItem[] = [
  { id: "webhooks", label: "Webhooks", href: "/dashboard/webhooks", icon: Globe },
  { id: "alerts", label: "Alert Policies", href: "/dashboard/alerts", icon: Bell },
  { id: "incidents", label: "Incidents", href: "/dashboard/incidents", icon: FileText },
  { id: "feedback", label: "Feedback", href: "/dashboard/feedback", icon: BarChart3 },
  { id: "exports", label: "Data Exports", href: "/dashboard/exports", icon: FileText },
];

const productsNav: NavItem[] = [
  { id: "scanner", label: "Scanner", href: "/dashboard/products/scanner", icon: Zap, pro: true },
  { id: "waf", label: "WAF", href: "/dashboard/products/waf", icon: Shield, pro: true },
  { id: "proxy", label: "Proxy", href: "/dashboard/products/proxy", icon: Globe, pro: true },
  { id: "api-shield", label: "API Shield", href: "/dashboard/products/api-shield", icon: Lock, pro: true },
  { id: "identity", label: "Identity", href: "/dashboard/products/identity", icon: Users, pro: true },
  { id: "analytics-pro", label: "Analytics Pro", href: "/dashboard/products/analytics-pro", icon: BarChart3, pro: true },
  { id: "compliance", label: "Compliance", href: "/dashboard/products/compliance", icon: ClipboardCheck, pro: true },
  { id: "test-lab", label: "Test Lab", href: "/dashboard/products/test-lab", icon: FlaskConical, pro: true },
  { id: "edge", label: "Edge", href: "/dashboard/products/edge", icon: Cloud, pro: true },
  { id: "marketplace", label: "Marketplace", href: "/dashboard/products/marketplace", icon: ShoppingBag, pro: true },
];

const adminNav: NavItem[] = [
  { id: "overview", label: "Overview", href: "/admin", icon: LayoutDashboard },
  { id: "users", label: "Users", href: "/admin?tab=users", icon: Users },
  { id: "rules", label: "Project Rules", href: "/admin?tab=rules", icon: Shield },
  { id: "pricing", label: "Pricing", href: "/admin?tab=pricing", icon: FileText },
  { id: "messages", label: "Messages", href: "/admin?tab=messages", icon: FileText },
  { id: "billing", label: "Billing", href: "/admin?tab=billing", icon: BarChart3 },
  { id: "abuse", label: "Abuse Queue", href: "/admin?tab=abuse", icon: AlertTriangle },
  { id: "audit", label: "Audit Log", href: "/admin?tab=audit", icon: FileText },
  { id: "cms", label: "Content CMS", href: "/admin?tab=cms", icon: FileText },
  { id: "features", label: "Feature Lab", href: "/admin?tab=features", icon: Zap },
];

const planFeatures: Record<string, string[]> = {
  Hobby: ["projects", "sdk", "analytics", "security", "simulator"],
  Pro: ["projects", "sdk", "analytics", "security", "simulator", "webhooks", "alerts", "incidents", "threats", "fingerprints", "feedback", "exports"],
  Enterprise: ["projects", "sdk", "analytics", "security", "simulator", "webhooks", "alerts", "incidents", "threats", "fingerprints", "feedback", "exports", "scanner", "waf", "proxy", "api-shield", "identity", "analytics-pro", "compliance", "test-lab", "edge", "marketplace"],
};

export function DashboardShell({ children, userType, userName, userPlan, onLogout }: DashboardShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const pathname = usePathname();
  const queryTab = useSearchParams().get("tab");
  const plan = userPlan || "Hobby";

  const navItems = userType === "admin" ? adminNav : [...coreNav, ...securityNav, ...operationsNav, ...productsNav];

  const hasAccess = (id: string) => {
    if (userType === "admin") return true;
    return planFeatures[plan]?.includes(id) || planFeatures["Enterprise"]?.includes(id);
  };

  const isActive = (href: string) => {
    const url = new URL(href, "https://botshield.local");
    return pathname === url.pathname && (url.searchParams.get("tab") ? queryTab === url.searchParams.get("tab") : !queryTab);
  };

  const SectionHeader = ({ label, section }: { label: string; section: string }) => (
    <button
      onClick={() => setExpandedSection(expandedSection === section ? null : section)}
      className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:text-slate-400 transition-colors"
    >
      {label}
      <ChevronRight className={`w-3 h-3 transition-transform ${expandedSection === section ? "rotate-90" : ""}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="font-bold text-lg tracking-tight">BotShield</span>
            {userType === "admin" && <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-semibold uppercase">Admin</span>}
          </Link>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {userType === "admin" ? (
            navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.id} href={item.href} onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(item.href) ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })
          ) : (
            <>
              {/* Core */}
              <SectionHeader label="Core" section="core" />
              {(expandedSection === "core" || expandedSection === null) && coreNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.id} href={item.href} onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(item.href) ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Security */}
              <SectionHeader label="Security" section="security" />
              {(expandedSection === "security" || expandedSection === null) && securityNav.map((item) => {
                const Icon = item.icon;
                const locked = !hasAccess(item.id);
                return (
                  <Link key={item.id} href={locked ? "/pricing" : item.href} onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${locked ? "text-slate-600 cursor-not-allowed" : isActive(item.href) ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                    {locked && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                  </Link>
                );
              })}

              {/* Operations */}
              <SectionHeader label="Operations" section="operations" />
              {(expandedSection === "operations" || expandedSection === null) && operationsNav.map((item) => {
                const Icon = item.icon;
                const locked = !hasAccess(item.id);
                return (
                  <Link key={item.id} href={locked ? "/pricing" : item.href} onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${locked ? "text-slate-600 cursor-not-allowed" : isActive(item.href) ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                    {locked && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                  </Link>
                );
              })}

              {/* Products */}
              <SectionHeader label="Products" section="products" />
              {(expandedSection === "products" || expandedSection === null) && productsNav.map((item) => {
                const Icon = item.icon;
                const locked = !hasAccess(item.id);
                return (
                  <Link key={item.id} href={locked ? "/pricing" : item.href} onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${locked ? "text-slate-600 cursor-not-allowed" : isActive(item.href) ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                    {item.pro && <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-violet-500/10 text-violet-400">Pro</span>}
                    {locked && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Plan badge + Upgrade */}
        {userType !== "admin" && (
          <div className="p-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-white">{plan} Plan</span>
              {plan !== "Enterprise" && (
                <Link href="/pricing" className="ml-auto px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-600 text-white hover:bg-blue-500">Upgrade</Link>
              )}
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName || "User"}</p>
              <p className="text-xs text-slate-500 truncate">{userType === "admin" ? "Administrator" : `${plan} Plan`}</p>
            </div>
          </div>
          {onLogout && (
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <BackButton fallback={userType === "admin" ? "/admin" : "/dashboard"} label="Back" className="px-2.5 lg:px-3" />
            <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-white capitalize">
              {navItems.find((n) => isActive(n.href))?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {userType !== "admin" && plan !== "Enterprise" && (
              <Link href="/pricing" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors">
                <Crown className="w-3 h-3" />
                Upgrade to {plan === "Hobby" ? "Pro" : "Enterprise"}
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
