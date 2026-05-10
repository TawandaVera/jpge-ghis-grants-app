import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Search, Target, FileText, 
  Kanban, Building2, Menu, X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/discovery", label: "Discovery", icon: Search },
  { to: "/matches", label: "Matches", icon: Target },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/org-profile", label: "Org Profile", icon: Building2 },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavItems = () => (
    <>
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === to
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-200 p-4 shrink-0">
        <div className="mb-6">
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">GP</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">GrantPath AI</p>
              <p className="text-xs text-slate-400">GHIS LLC</p>
            </div>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          <NavItems />
        </nav>
        <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
          <p className="text-xs text-emerald-700 font-medium">GHIS LLC</p>
          <p className="text-xs text-emerald-600">$3.2M deployed · 14 states</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">GP</span>
          </div>
          <p className="font-bold text-slate-900 text-sm">GrantPath AI</p>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-14">
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