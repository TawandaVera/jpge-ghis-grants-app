import {
  LayoutDashboard,
  Search,
  BarChart3,
  Kanban,
  Bot,
  Package,
  BookOpen,
  Building2,
  ClipboardList,
} from "lucide-react";

export const APP_ROUTES = Object.freeze([
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/discovery", label: "1. Discovery", icon: Search },
  { path: "/assessment", label: "2. Assessment", icon: BarChart3 },
  { path: "/pipeline", label: "3. Grant Pipeline", icon: Kanban },
  { path: "/copilot", label: "4. Co-Pilot", icon: Bot },
  { path: "/pack", label: "5. Pack & Export", icon: Package },
  { path: "/dossier", label: "Grant Dossier", icon: BookOpen },
  { path: "/tracker", label: "App Tracker", icon: ClipboardList },
  { path: "/org-profile", label: "Org Profile", icon: Building2 },
]);

export function isKnownRoute(pathname) {
  return APP_ROUTES.some((route) => route.path === pathname);
}
