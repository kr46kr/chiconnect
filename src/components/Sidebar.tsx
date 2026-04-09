import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Users2, UserCircle, Search, LogOut } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/events", icon: Calendar, label: "Discover Events" },
  { to: "/groups", icon: Users2, label: "Groups" },
  { to: "/people", icon: Search, label: "People" },
  { to: "/profile", icon: UserCircle, label: "My Profile" },
];

export function Sidebar() {
  const currentUser = useCurrentUser();
  const location = useLocation();
  const { signOut } = useAuth();

  if (!currentUser) return null;

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[280px] flex-col bg-sidebar text-sidebar-foreground z-40">
      <div className="p-6">
        <h1 className="font-display text-xl font-bold text-sidebar-primary-foreground">
          <span className="text-sidebar-primary">Chi</span>Connect
        </h1>
      </div>

      <nav className="flex-1 px-3">
        <p className="text-xs uppercase tracking-wider text-sidebar-foreground/50 px-3 mb-3">Navigate</p>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-9 h-9 rounded-full bg-sidebar-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-sidebar-primary-foreground truncate">{currentUser.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{currentUser.location}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
