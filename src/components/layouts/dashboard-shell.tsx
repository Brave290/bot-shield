"use client";

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Shield, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Users, 
  FileText, 
  BarChart3,
  Code2
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  id: string;
}

interface DashboardShellProps {
  children: ReactNode;
  userType: "user" | "admin";
  userName?: string;
  onLogout?: () => void;
}

export function DashboardShell({ children, userType, userName, onLogout }: DashboardShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Define navigation based on user type
  const navItems: NavItem[] = userType === "admin" 
    ? [
        { id: "overview", label: "Overview", href: "/admin", icon: LayoutDashboard },
        { id: "cms", label: "Content (CMS)", href: "/admin?tab=cms", icon: FileText },
        { id: "users", label: "Users", href: "/admin?tab=admins", icon: Users },
        { id: "analytics", label: "Analytics", href: "/admin?tab=audit", icon: BarChart3 },
        { id: "settings", label: "Settings", href: "/admin?tab=rules", icon: Settings },
      ]
    : [
        { id: "projects", label: "Projects", href: "/dashboard", icon: Shield },
        { id: "sdk", label: "SDK & Integration", href: "/dashboard?tab=sdk", icon: Code2 },
        { id: "analytics", label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
        { id: "settings", label: "Settings", href: "/dashboard?tab=settings", icon: Settings },
      ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Mobile Overlay */}
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
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="font-bold text-lg tracking-tight">BotShield</span>
            {userType === "admin" && (
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-semibold uppercase tracking-wider">Admin</span>
            )}
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href.includes("?") && pathname === item.href.split("?")[0]);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"}
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName || "User"}</p>
              <p className="text-xs text-slate-500 truncate">{userType === "admin" ? "Administrator" : "Free Plan"}</p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (Mobile Menu Trigger) */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button 
            onClick={() => setIsMobileOpen(true)} 
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-white capitalize">
              {navItems.find(n => n.href === pathname || (n.href.includes("?") && pathname.startsWith(n.href.split("?")[0])))?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Placeholder for notifications or theme toggle later */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
