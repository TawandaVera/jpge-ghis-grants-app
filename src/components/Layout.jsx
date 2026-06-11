import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Search, BarChart3, 
  Kanban, Bot, Package, LogOut, Menu, X, BookOpen, Building2, ClipboardList, FolderOpen, Users, Sparkles, HelpCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const NAV = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/discovery", label: "1. Find Funding", icon: Search },
  { to: "/assessment", label: "2. Score Matches", icon: BarChart3 },
  { to: "/pipeline", label: "3. Track Progress", icon: Kanban },
  { to: "/copilot", label: "4. Write with AI", icon: Bot },
  { to: "/pack", label: "5. Finish & Download", icon: Package },
  { to: "/dossier", label: "Funding Library", icon: BookOpen },
  { to: "/tracker", label: "My Applications", icon: ClipboardList },
  { to: "/org-profile", label: "About My Org", icon: Building2 },
  { to: "/ai-assistant", label: "Ask AI", icon: Sparkles },
  { to: "/my-workspace", label: "My Workspace", icon: FolderOpen },
  { to: "/admin/workspaces", label: "Admin: Users", icon: Users, adminOnly: true },
  { to: "/help", label: "Help", icon: HelpCircle },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserRole(u?.role)).catch(() => {});
  }, []);

  const NavItems = () => (
    <>
      {NAV.filter(item => !item.adminOnly || userRole === "admin").map(({ to, label, icon: Icon, adminOnly }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === to
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : adminOnly
                ? "text-amber-400/70 hover:bg-white/5 hover:text-amber-300"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-48 bg-slate-900 shrink-0">
        <div className="p-4 border-b border-slate-800">
          <p className="font-bold text-white text-sm">
            <span className="text-emerald-400">JPGE</span> CIE
          </p>
          <p className="text-xs text-slate-500 mt-0.5">CAPITAL INTELLIGENCE</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavItems />
        </nav>
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <p className="font-bold text-white text-sm"><span className="text-emerald-400">JPGE</span> CIE</p>
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5 text-slate-300" /> : <Menu className="w-5 h-5 text-slate-300" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900 pt-14">
          <nav className="p-4 space-y-1">
            <NavItems />
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}