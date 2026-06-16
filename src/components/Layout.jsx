import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Search, BarChart3, 
  Kanban, Bot, Package, LogOut, Menu, X, BookOpen, Building2, ClipboardList, FolderOpen, Users, Sparkles, HelpCircle, Layers
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const WORKFLOW = [
  { to: "/discovery", label: "Find Funding", icon: Search, step: 1 },
  { to: "/assessment", label: "Score Matches", icon: BarChart3, step: 2 },
  { to: "/pipeline", label: "Track Progress", icon: Kanban, step: 3 },
  { to: "/copilot", label: "Write with AI", icon: Bot, step: 4 },
  { to: "/pack", label: "Finish & Download", icon: Package, step: 5 },
];

const TOOLS = [
  { to: "/dossier", label: "Funding Library", icon: BookOpen },
  { to: "/tracker", label: "My Applications", icon: ClipboardList },
  { to: "/org-profile", label: "About My Org", icon: Building2 },
  { to: "/ai-assistant", label: "Ask AI", icon: Sparkles },
  { to: "/my-workspace", label: "My Workspace", icon: FolderOpen },
  { to: "/tracks", label: "Tracks", icon: Layers },
];

const ADMIN = [
  { to: "/admin/workspaces", label: "Admin: Users", icon: Users, adminOnly: true },
];

const BOTTOM = [
  { to: "/help", label: "Help", icon: HelpCircle },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserRole(u?.role)).catch(() => {});
  }, []);

  const NavLink = ({ to, label, icon: Icon, adminOnly, step }) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        pathname === to
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : adminOnly
            ? "text-amber-400/70 hover:bg-white/5 hover:text-amber-300"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      )}
    >
      {step ? (
        <span className={cn(
          "w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0",
          pathname === to ? "bg-emerald-400 text-slate-900" : "bg-slate-700 text-slate-400"
        )}>{step}</span>
      ) : (
        <Icon className="w-4 h-4 shrink-0" />
      )}
      {label}
    </Link>
  );

  const NavItems = () => (
    <>
      {/* Home */}
      <Link
        to="/"
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
          pathname === "/"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
        )}
      >
        <LayoutDashboard className="w-4 h-4 shrink-0" />
        Home
      </Link>

      {/* Workflow Steps */}
      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 pt-2 pb-1">Workflow</p>
      {WORKFLOW.map(item => <NavLink key={item.to} {...item} />)}

      {/* Tools */}
      <div className="my-2 border-t border-slate-800" />
      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 pb-1">Tools</p>
      {TOOLS.map(item => <NavLink key={item.to} {...item} />)}

      {/* Admin */}
      {userRole === "admin" && (
        <>
          <div className="my-2 border-t border-slate-800" />
          {ADMIN.map(item => <NavLink key={item.to} {...item} />)}
        </>
      )}
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
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            to="/help"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full",
              pathname === "/help"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <HelpCircle className="w-4 h-4" /> Help
          </Link>
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2.5 px-3 py-2 w-full text-left text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors"
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